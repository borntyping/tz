class Location {
    displayName;
    timezoneName;
    className;

    constructor(displayName, timezoneName, className) {
        this.displayName = displayName;
        this.timezoneName = timezoneName;
        this.className = className;
    }
}

class TimeCell {
    el;

    constructor(hour, location) {
        this.hour = hour;
        this.location = location;

        this.hourSpan = redom.html("span.hour");
        this.ampmSpan = redom.html("span.ampm");

        this.el = redom.html("a.localtime", { href: `#${this.hour}`, class: this.location.className }, [this.hourSpan, this.ampmSpan]);
    }

    update(utcDateTime) {
        const localDateTime = utcDateTime.set({ hour: this.hour }).setZone(this.location.timezoneName);

        redom.setAttr(this.el, {
            "same-day-as-here": utcDateTime.day === localDateTime.day,
            "asleep": localDateTime.hour <= 8 || localDateTime.hour >= 18,
            "now": utcDateTime.hour === localDateTime.hour,
        });

        this.hourSpan.textContent = localDateTime.hour === 0 ? 12 : (localDateTime.hour <= 12 ? localDateTime.hour : localDateTime.hour - 12);
        this.ampmSpan.textContent = localDateTime.hour >= 12 ? "pm" : "am";
    }
}

class TimeColumn {
    el;

    constructor(hour, locations) {
        this.hour = hour;
        this.localtimes = locations.map(location => new TimeCell(hour, location))
        this.el = redom.html(`div.time#${hour}`, [].concat(this.localtimes));
    }

    update(utcDateTime) {
        const isNow = utcDateTime.hour === this.hour;

        this.el.className = `time ${isNow ? "now" : ""}`

        this.localtimes.forEach(l => l.update(utcDateTime));
    }
}

class Header {
    el;

    constructor(location) {
        this.location = location;

        this.name = redom.html("div.name");
        this.offset = redom.html("span.offset")

        this.meta = redom.html("div.meta", [this.offset]);
        this.el = redom.html("div.location", { "class": this.location.className }, [this.name, this.meta]);
    }

    update(utcDateTime) {
        this.name.textContent = this.location.displayName;
        this.offset.textContent = utcDateTime.setZone(this.location.timezoneName).offsetNameShort;
    }

}

class HeaderColumn {
    el;

    constructor(locations) {
        this.cells = locations.map(l => new Header(l));
        this.el = redom.html("div.headers", this.cells);
    }

    update(utc) {
        this.cells.forEach(l => l.update(utc));
    }
}

class Locations {
    el;

    constructor(name, times, locations) {
        this.name = name;
        this.locations = new HeaderColumn(locations);
        this.times = times.map(t => new TimeColumn(t, locations));

        this.el = redom.html("div.locations", [
            redom.html("div.title", redom.html("h1", this.name)),
            redom.html("div.timezones", [].concat([this.locations]).concat(this.times))
        ]);
    }

    update(utc) {
        this.locations.update(utc);
        this.times.forEach(t => t.update(utc));
    }
}

class Main {
    el;

    constructor(locations) {
        const footer = redom.html("footer", redom.html("a", { href: "#" }, "Reset"));

        this.locations = locations;
        this.el = redom.html("div", this.locations.concat(footer));
    }

    update(utc) {
        this.locations.forEach(l => l.update(utc));
    }

    install(element) {
        redom.mount(element, this);
        this.update(luxon.DateTime.utc());
    }

    refresh() {
        window.setInterval(() => this.update(luxon.DateTime.utc()), 5000);
    }

    refresh_development() {
        let now = luxon.DateTime.utc();

        window.setInterval(() => {
            now = now.plus({ hours: 1 });
            this.update(now);
        }, 1000);
    }
}

window.onload = function onload() {
    const times = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23];

    const main = new Main([
        new Locations("Locations", times, [
            new Location("Ontario, Canada", "Canada/Central"),
            new Location("Boston, U.S.A.", "America/New_York"),
            new Location("Connecticut, U.S.A.", "America/New_York"),
            new Location("Reading, England", "Europe/London", "highlight"),
            new Location("Amsterdam, Netherlands", "Europe/Amsterdam"),
            new Location("Munich, Germany", "Europe/Berlin"),
            new Location("Sydney, Australia", "Australia/Sydney"),
        ]),
        new Locations("Timezones", times, [
            new Location("EST", "EST"),
            new Location("GMT", "GMT"),
        ])
    ]);

    main.install(document.getElementById("main"));
    main.refresh();
};
