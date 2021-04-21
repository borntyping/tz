class Timezone {
    displayName;
    timezoneName;

    constructor(displayName, timezoneName) {
        this.displayName = displayName;
        this.timezoneName = timezoneName;
    }
}

class TimezoneCell {
    el;

    constructor(hour, location) {
        this.hour = hour;
        this.location = location;

        this.marker = redom.html("div.marker");
        this.hourSpan = redom.html("div.hour");
        this.ampmSpan = redom.html("div.ampm");

        this.el = redom.html("div.localtime", { "data-hour": hour }, [this.marker, this.hourSpan, this.ampmSpan]);
    }

    update(utcDateTime) {
        const cellDateTime = utcDateTime.setZone("Europe/London").set({ hour: this.hour });
        const localDateTime = cellDateTime.setZone(this.location.timezoneName);
        const minute_percentage = Math.floor(cellDateTime.minute / 60 * 100);

        redom.setStyle(this.marker, { width: `${minute_percentage}%` });

        redom.setAttr(this.el, {
            "same-day-as-here": utcDateTime.day === localDateTime.day,
            "office-hours": 9 <= localDateTime.hour && localDateTime.hour <= 18,
            "night-hours": 5 >= localDateTime.hour || localDateTime.hour >= 22,
            "now": utcDateTime.hour === cellDateTime.hour,
        });

        this.hourSpan.textContent = localDateTime.hour === 0 ? 12 : (localDateTime.hour <= 12 ? localDateTime.hour : localDateTime.hour - 12);
        this.ampmSpan.textContent = localDateTime.hour >= 12 ? "pm" : "am";
    }
}

class TimezoneRow {
    el;
    location;

    constructor(location, hours) {
        this.location = location;

        this.name = redom.html("span.name");
        this.offset = redom.html("span.offset")
        this.description = redom.html("div.description", [this.name, this.offset]);

        this.weather = redom.html("div.weather", "⛅")

        this.cells = hours.map(hour => new TimezoneCell(hour, location));

        this.el = redom.html(
            "div.timezone-row",
            {
                "data-location-display-name": location.displayName,
                "data-location-timezone-name": location.timezoneName,
            },
            [this.weather, this.description, this.cells],
        )
    }

    update(utcDateTime) {
        const tzDateTime = utcDateTime.setZone(this.location.timezoneName);
        this.name.textContent = this.location.displayName;
        this.offset.textContent = tzDateTime.offsetNameLong;

        this.cells.forEach(c => c.update(utcDateTime));
    }
}

class TimezoneList {
    el;

    constructor(name, locations) {
        // Generate a list of hour offsets such that the current time is in the middle of the UI.
        const hours = Array(24).fill(25).map((x, y) => (y + 6));

        this.name = name;
        this.rows = locations.map(location => new TimezoneRow(location, hours));

        this.el = redom.html("div.timezone-list", [
            redom.html("div.title", redom.html("h1", this.name)),
            redom.html("div.timezone-grid", this.rows)
        ]);
    }

    update(utcDateTime) {
        this.rows.forEach(row => row.update(utcDateTime));
    }
}


class Favicon {
    el;

    constructor() {
        this.el = redom.html("link", { rel: "icon" });
    }

    update(localDateTime) {
        const emoji = Favicon.getEmoji(localDateTime);

        redom.setAttr(this.el, {
            href: `data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>${emoji}</text></svg>`
        });
    }

    static emoji = [
        ["🕛", "🕧"],
        ["🕐", "🕜"],
        ["🕑", "🕝"],
        ["🕒", "🕞"],
        ["🕓", "🕟"],
        ["🕔", "🕠"],
        ["🕕", "🕡"],
        ["🕖", "🕢"],
        ["🕗", "🕣"],
        ["🕘", "🕤"],
        ["🕙", "🕥"],
        ["🕚", "🕦"],
    ];

    static getEmoji(localDateTime) {
        const hour = localDateTime.hour % 12;
        const minute = Math.floor(localDateTime.minute / 30);
        return this.emoji[hour][minute];
    }
}

class Main {
    el;

    constructor(locations) {
        this.locations = locations;
        this.el = redom.html("div", this.locations);
    }

    update(utcDateTime) {
        this.locations.forEach(l => l.update(utcDateTime));
    }
}

class App {
    constructor() {
        this.main = new Main([
            new TimezoneList("Timezones", [
                new Timezone("Pacific Time", "America/Los_Angeles"),
                new Timezone("Eastern Time", "America/New_York"),
                new Timezone("British Time", "Europe/London"),
            ]),
            new TimezoneList("Locations", [
                new Timezone("Los Angeles", "America/Los_Angeles"),
                new Timezone("Ontario, Canada", "Canada/Central"),
                new Timezone("Boston, U.S.A.", "America/New_York"),
                // new Timezone("Connecticut, U.S.A.", "America/New_York"),
                new Timezone("Reading, England", "Europe/London"),
                new Timezone("Amsterdam, Netherlands", "Europe/Amsterdam"),
                // new Timezone("Munich, Germany", "Europe/Berlin"),
                new Timezone("Sydney, Australia", "Australia/Sydney"),
            ]),
        ]);

        this.favicon = new Favicon();
    }

    mount() {
        redom.mount(document.getElementById("main"), this.main);
        redom.mount(document.head, this.favicon);
        this.update();
    }

    update() {
        this.favicon.update(luxon.DateTime.local());
        this.main.update(luxon.DateTime.utc());
    }

    refresh() {
        window.setInterval(() => { this.update(); }, 30000);
    }
}

window.onload = function onload() {
    const app = new App();
    app.mount();
    app.refresh();
};
