class Timezone {
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

        this.el = redom.html("span.localtime", { class: this.location.className }, [this.hourSpan, this.ampmSpan]);
    }

    update(utcDateTime) {
        const cellDateTime = utcDateTime.plus({ hour: this.hour });
        const localDateTime = cellDateTime.setZone(this.location.timezoneName);

        redom.setAttr(this.el, {
            "same-day-as-here": utcDateTime.day === localDateTime.day,
            "asleep": localDateTime.hour <= 8 || localDateTime.hour >= 18,
            "now": utcDateTime.hour === cellDateTime.hour,
        });

        this.hourSpan.textContent = localDateTime.hour === 0 ? 12 : (localDateTime.hour <= 12 ? localDateTime.hour : localDateTime.hour - 12);
        this.ampmSpan.textContent = localDateTime.hour >= 12 ? "pm" : "am";
    }
}

class TimeColumn {
    el;

    constructor(hour, locations) {
        this.localtimes = locations.map(location => new TimeCell(hour, location))
        this.el = redom.html("div.time", [].concat(this.localtimes));
    }

    update(utcDateTime) {
        this.localtimes.forEach(l => l.update(utcDateTime));
    }
}

class Header {
    el;

    constructor(location) {
        this.location = location;

        this.name = redom.html("div.name");
        this.offsetLong = redom.html("span")
        this.offsetShort = redom.html("span")

        this.meta = redom.html("div.meta", [this.offsetLong]);
        this.el = redom.html("div.location", { "class": this.location.className }, [this.name, this.meta]);
    }

    update(utcDateTime) {
        const tzDateTime = utcDateTime.setZone(this.location.timezoneName);

        this.name.textContent = this.location.displayName;
        this.offsetLong.textContent = tzDateTime.offsetNameLong;
        this.offsetShort.textContent = tzDateTime.offsetNameShort;
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

class TimezoneList {
    el;

    constructor(name, locations) {
        // Generate a list of hour offsets such that the current time is in the middle of the UI.
        const hours = Array(25).fill(25).map((x, y) => (y - 12 + 3));

        this.name = name;
        this.locations = new HeaderColumn(locations);
        this.times = hours.map(h => new TimeColumn(h, locations));

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
    const main = new Main([
        new TimezoneList("Timezones", [
            new Timezone("Eastern Time", "America/New_York"),
            new Timezone("British Time", "Europe/London"),
        ]),
        new TimezoneList("Locations", [
            new Timezone("Ontario, Canada", "Canada/Central"),
            new Timezone("Boston, U.S.A.", "America/New_York"),
            new Timezone("Connecticut, U.S.A.", "America/New_York"),
            new Timezone("Reading, England", "Europe/London", "highlight"),
            new Timezone("Amsterdam, Netherlands", "Europe/Amsterdam"),
            new Timezone("Munich, Germany", "Europe/Berlin"),
            new Timezone("Sydney, Australia", "Australia/Sydney"),
        ]),
    ]);

    main.install(document.getElementById("main"));
    main.refresh();
};
