const times = ["12:00am", "01:00am", "02:00am", "03:00am", "04:00am", "05:00am", "06:00am", "07:00am", "08:00am", "09:00am", "10:00am", "11:00am", "12:00pm", "01:00pm", "02:00pm", "03:00pm", "04:00pm", "05:00pm", "06:00pm", "07:00pm", "08:00pm", "09:00pm", "10:00pm", "11:00pm"];

class Time {
    constructor(time) {
        this.time = time;
        this.el = redom.html("div.time", time);
    }

    update(utc, timezone) {
        var time = utc.time(this.time);
        var local = time.goto(timezone);

        var highlight = utc.hour() === time.hour() ? "highlight" : "";
        var asleep = local.isAsleep() ? "asleep" : "awake"

        var hour = local.hour();
        var display_hour = hour == 0 ? 12 : (hour <= 12 ? hour : hour - 12);
        var display_ampm = hour >= 12 ? "p.m." : "a.m.";

        this.el.className = `time ${highlight} ${asleep}`
        redom.setChildren(this.el, [
            redom.html("span.hour", display_hour),
            redom.html("span.ampm", display_ampm),
        ]);
    }
}


class Location {
    constructor(timezone) {
        this.timezone = timezone;
        this.times = times.map(t => new Time(t));
        this.el = redom.el("div.location");
    }

    update(utc) {
        var local = utc.goto(this.timezone);
        var timezone = local.timezone();
        this.times.forEach(t => t.update(utc, this.timezone));

        var inDST = local.inDST() ? "inDST" : "";
        var hasDST = local.hasDST() ? "hasDST" : "";

        var headers = [
            redom.html("div.timezone", timezone.name),
            redom.html("div.offset", this.offset(timezone.current.offset)),
            redom.html(`div.dst.${inDST}.${hasDST}`, local.hasDST() ? "DST" : ""),
        ];
        redom.setChildren(this.el, headers.concat(this.times));
    }

    offset(n) {
        return `${n >= 0 ? '+' : '-'}${Math.abs(n)}`
    }
}

class Locations {
    constructor(timezones) {
        this.timezones = timezones;
        this.locations = timezones.map(timezone => new Location(timezone))
        this.el = redom.el("div.locations", this.locations);
    }

    update(utc) {
        this.locations.forEach(l => {
            l.update(utc)
        });
    }
}

window.onload = function onload() {
    const locations = new Locations([
        "Canada/Central",
        "America/New_York",
        "Europe/London",
        "Etc/GMT",
        "Europe/Berlin",
        "Australia/Sydney",
    ])
    locations.update(spacetime.now("Etc/UTC"));
    redom.mount(document.getElementById("main"), locations);
};
