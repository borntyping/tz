const times = ["12:00am", "01:00am", "02:00am", "03:00am", "04:00am", "05:00am", "06:00am", "07:00am", "08:00am", "09:00am", "10:00am", "11:00am", "12:00pm", "01:00pm", "02:00pm", "03:00pm", "04:00pm", "05:00pm", "06:00pm", "07:00pm", "08:00pm", "09:00pm", "10:00pm", "11:00pm"];

class Location {
    constructor(displayName, timezoneName, className) {
        this.displayName = displayName;
        this.timezoneName = timezoneName;
        this.className = className;
    }
}

class TimeCell {
    constructor(time, location) {
        this.time = time;
        this.location = location;

        this.hour = redom.html("span.hour");
        this.ampm = redom.html("span.ampm");

        this.el = redom.html("a.localtime", { href: `#${this.time}`, class: this.location.className }, [this.hour, this.ampm]);
    }

    update(utc) {
        var here = utc.time(this.time);
        var local = here.goto(this.location.timezoneName);

        redom.setAttr(this.el, {
            "here": here.time(),
            "same-day-as-here": here.day() == local.day(),
            "local": local.time(),
            "local-hour": local.hour(),
            "asleep": local.isAsleep(),
            "now": utc.hour() === here.hour(),
        });

        var hour = local.hour();
        this.hour.textContent = hour == 0 ? 12 : (hour <= 12 ? hour : hour - 12);
        this.ampm.textContent = hour >= 12 ? "pm" : "am";
    }
}

class TimeColumn {
    constructor(time, locations) {
        this.time = time;
        this.localtimes = locations.map(location => new TimeCell(time, location))
        this.el = redom.html(`div.time#${time}`, [].concat(this.localtimes));
    }

    update(utc) {
        var isNow = utc.hour() === utc.time(this.time).hour();
        this.el.className = `time ${isNow ? "now" : ""}`

        this.localtimes.forEach(l => l.update(utc));
    }
}

class Header {
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
        this.el = redom.html("div.location", { "class": this.location.className }, [this.name, this.meta]);
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

class HeaderColumn {
    constructor(locations) {
        this.cells = locations.map(l => new Header(l));
        this.el = redom.html("div.headers", this.cells);
    }

    update(utc) {
        this.cells.forEach(l => l.update(utc));
    }
}

class Locations {
    constructor(name, locations) {
        this.name = name;
        this.locations = new HeaderColumn(locations);
        this.times = times.map(t => new TimeColumn(t, locations));

        this.el = redom.html("div.locations", [
            redom.html("div.title", redom.html("h1", this.name)),
            redom.html("div.timezones", [this.locations].concat(this.times))
        ]);
    }

    update(utc) {
        this.locations.update(utc);
        this.times.forEach(t => t.update(utc));
    }
}

class Main {
    constructor(locations) {
        this.locations = locations;
        this.el = redom.html("div", this.locations.concat(
            redom.html("footer", redom.html("a", { href: "#" }, "Reset"))
        ));
    }

    update(utc) {
        this.locations.forEach(l => l.update(utc));
    }

    install(element) {
        redom.mount(element, this);
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
    const main = new Main([
        new Locations("Timezones", [
            new Location("Ontario, Canada", "Canada/Central"),
            new Location("Boston, U.S.A.", "America/New_York"),
            new Location("Connecticut, U.S.A.", "America/New_York"),
            new Location("Reading, England", "Europe/London", "highlight"),
            new Location("Amsterdam, Netherlands", "Europe/Amsterdam"),
            new Location("Munich, Germany", "Europe/Berlin"),
            new Location("Sydney, Australia", "Australia/Sydney"),
        ])
    ])

    main.install(document.getElementById("main"));
    main.refresh()
};
