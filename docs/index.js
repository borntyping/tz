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
        this.hourSpan = redom.html("div.hour.primary");
        this.ampmSpan = redom.html("div.ampm.secondary");

        this.el = redom.html("div.localtime", {"data-hour": hour}, [this.marker, this.hourSpan, this.ampmSpan]);
    }

    update(localDateTime) {
        const cellDateTime = localDateTime.set({hour: this.hour});
        const remoteDateTime = cellDateTime.setZone(this.location.timezoneName);
        const minute_percentage = Math.floor(cellDateTime.minute / 60 * 100);

        redom.setStyle(this.marker, {width: `${minute_percentage}%`});

        redom.setAttr(this.el, {
            "lunch-hours": remoteDateTime.hour === 13,
            "office-hours": 9 <= remoteDateTime.hour && remoteDateTime.hour <= 17,
            "night-hours": 5 >= remoteDateTime.hour || remoteDateTime.hour >= 21,
            "now": localDateTime.hour === cellDateTime.hour,
        });

        this.hourSpan.textContent = remoteDateTime.hour === 0 ? 12 : (remoteDateTime.hour <= 12 ? remoteDateTime.hour : remoteDateTime.hour - 12);
        this.ampmSpan.textContent = remoteDateTime.hour >= 12 ? "pm" : "am";
    }
}

class TimezoneRow {
    el;
    location;

    constructor(location, hours) {
        this.location = location;

        this.name = redom.html("span.name.primary");
        this.offset = redom.html("span.offset.secondary")
        this.description = redom.html("div.description", [this.name, this.offset]);

        this.cells = hours.map(hour => new TimezoneCell(hour, location));

        this.el = redom.html(
            "div.timezone-row",
            {
                "data-location-display-name": location.displayName,
                "data-location-timezone-name": location.timezoneName,
            },
            [this.description, this.cells],
        )
    }

    update(localDateTime) {
        const tzDateTime = localDateTime.setZone(this.location.timezoneName);
        this.name.textContent = this.location.displayName;
        this.offset.textContent = tzDateTime.offsetNameLong;
        this.cells.forEach(cell => cell.update(localDateTime));
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

    update(localDateTime) {
        this.rows.forEach(row => row.update(localDateTime));
    }
}


class Favicon {
    el;

    constructor() {
        this.el = redom.html("link", {rel: "icon"});
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

    constructor(lists) {
        this.lists = lists;
        this.el = redom.html("div", this.lists);
    }

    update(localDateTime) {
        this.lists.forEach(timezoneList => timezoneList.update(localDateTime));
    }
}

class App {
    constructor() {
        this.main = new Main([
            new TimezoneList("Timezones", [
                new Timezone("Reading, England", "Europe/London", "London,UK"),
                new Timezone("Boston, U.S.A.", "America/New_York", "Boston,US"),
                new Timezone("Montana, USA.", "America/Denver", "Montana,US"),
                new Timezone("Los Angeles", "America/Los_Angeles", "Los Angeles,US"),
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
        const localDateTime = luxon.DateTime.local()
        this.favicon.update(localDateTime);
        this.main.update(localDateTime);
    }

    refresh() {
        window.setInterval(() => {
            this.update();
        }, 30000);
    }
}

window.onload = function onload() {
    window.app = new App();
    window.app.mount();
    window.app.refresh();
};
