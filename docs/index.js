const times = ["12:00am", "01:00am", "02:00am", "03:00am", "04:00am", "05:00am", "06:00am", "07:00am", "08:00am", "09:00am", "10:00am", "11:00am", "12:00pm", "01:00pm", "02:00pm", "03:00pm", "04:00pm", "05:00pm", "06:00pm", "07:00pm", "08:00pm", "09:00pm", "10:00pm", "11:00pm"];

class TimeCell {
    constructor(time, timezone) {
        this.time = time;
        this.timezone = timezone;

        this.hour = redom.html("span.hour");
        this.ampm = redom.html("span.ampm");

        this.el = redom.html("a.localtime", { href: `#${this.time}` }, [this.hour, this.ampm]);
    }

    update(utc) {
        var here = utc.time(this.time);
        var local = here.goto(this.timezone);

        redom.setAttr(this.el, {
            "asleep": local.isAsleep(),
            "now": utc.hour() === here.hour(),
        });

        var hour = local.hour();
        this.hour.textContent = hour == 0 ? 12 : (hour <= 12 ? hour : hour - 12);
        this.ampm.textContent = hour >= 12 ? "pm" : "am";
    }
}

class TimeColumn {
    constructor(time, timezones) {

        console.log(timezones);
        this.time = time;
        this.localtimes = timezones.map(timezone => new TimeCell(time, timezone))
        this.el = redom.html(`div.time#${time}`, [].concat(this.localtimes));
    }

    update(utc) {
        var isNow = utc.hour() === utc.time(this.time).hour();
        this.el.className = `time ${isNow ? "now" : ""}`

        this.localtimes.forEach(l => l.update(utc));
    }
}


class Location {
    constructor(displayName, timezoneName) {
        this.displayName = displayName;
        this.timezoneName = timezoneName;
    }
}


class LocationCell {
    constructor(location) {
        this.location = location;

        this.name = redom.html("div.name");
        this.date = redom.html("span.date");
        this.offset = redom.html("span.hide.offset")
        this.dst = redom.html("span.hide.dst")

        this.meta = redom.html("div.meta", [
            this.date,
            redom.html("span", [this.dst, " ", this.offset]),
        ])
        this.el = redom.html("div.location", [this.name, this.meta]);
    }

    update(utc) {
        var local = utc.goto(this.location.timezoneName);
        var timezone = local.timezone();

        this.name.textContent = this.location.displayName;
        this.date.textContent = `${local.format("day")} ${local.format("date-ordinal")} ${local.format("month")}`;
        this.offset.textContent = `UTC${timezone.current.offset >= 0 ? '+' : '-'}${Math.abs(timezone.current.offset)}`;
        this.dst.textContent = local.hasDST() ? "DST" : "---";

        redom.setAttr(this.dst, { inDST: local.inDST(), hasDST: local.hasDST() });
    }

}

class LocationColumn {
    constructor(locations) {
        this.cells = locations.map(l => new LocationCell(l));
        this.el = redom.html("div.locations", this.cells);
    }

    update(utc) {
        this.cells.forEach(l => l.update(utc));
    }
}

class Locations {
    constructor(locations) {
        this.locations = new LocationColumn(locations);
        this.times = times.map(t => new TimeColumn(t, locations.map(t => t.timezoneName)));
        this.el = redom.html("div.timezones", [this.locations].concat(this.times));
    }

    update(utc) {
        this.locations.update(utc);
        this.times.forEach(t => t.update(utc));
    }

    install() {
        redom.mount(document.getElementById("timezones"), this);
        this.update(this.now());
    }

    refresh() {
        window.setInterval(() => this.update(this.now()), 5000);
    }

    refresh_development() {
        var now = this.now();
        window.setInterval(() => {
            now = now.next('hour');
            this.update(now);
        }, 1000);
    }

    now() {
        return spacetime.now("Etc/UTC");
    }
}

window.onload = function onload() {
    const locations = new Locations([
        new Location("Ontario, Canada", "Canada/Central"),
        new Location("Boston, U.S.A", "America/New_York"),

        new Location("Reading, England", "Europe/London"),
        new Location("Amsterdam, Netherlands", "Europe/Amsterdam"),
        new Location("Munich, Germany", "Europe/Berlin"),
        new Location("Sydney, Australia", "Australia/Sydney"),
    ])

    locations.install(document.getElementById("main"));
    locations.refresh()
};
