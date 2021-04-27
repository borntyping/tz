class Timezone {
    displayName;
    timezoneName;

    constructor(displayName, timezoneName, weatherName) {
        this.displayName = displayName;
        this.timezoneName = timezoneName;
        this.weatherName = weatherName;
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
            "office-hours": 9 <= remoteDateTime.hour && remoteDateTime.hour <= 18,
            "night-hours": 5 >= remoteDateTime.hour || remoteDateTime.hour >= 22,
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

        this.weather = redom.html("div.weather")

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

    update(localDateTime, appid) {
        const tzDateTime = localDateTime.setZone(this.location.timezoneName);
        this.name.textContent = this.location.displayName;
        this.offset.textContent = tzDateTime.offsetNameLong;
        this.cells.forEach(cell => cell.update(localDateTime));
        this.setWeatherIcon(appid);
    }

    setWeatherIcon(appid) {
        if (this.location.weatherName !== undefined) {
            if (appid) {
                const url = new URL("https://api.openweathermap.org/data/2.5/weather");
                url.searchParams.append("q", this.location.weatherName);
                url.searchParams.append("units", "metric");
                url.searchParams.append("appid", appid);
                fetch(url.toString())
                    .then(response => {
                        if (!response.ok) {
                            throw new Error(`Failed to fetch weather from ${url}`);
                        }
                        return response.json();
                    })
                    .then(data => {
                        const icon = data.weather[0].icon
                        const src = `https://openweathermap.org/img/wn/${icon}.png`;
                        const title = `${data.name}: ${data.weather[0].description}, feels like ${data.main.temp}℃.`;
                        redom.setChildren(this.weather, redom.html("img", {src: src, title: title}));
                    }).catch((error) => {
                        console.error(error);
                });
            } else {
                redom.setChildren(this.weather, []);
            }
        }
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

    update(localDateTime, appid) {
        this.rows.forEach(row => row.update(localDateTime, appid));
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
            href: `data:image/svg+xml,<svg xmlns="%22http://www.w3.org/2000/svg%22" viewBox="%220" 0 100 100%22><text y="%22.9em%22" font-size="%2290%22">${emoji}</text></svg>`
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

        this.footer = redom.html("footer");
        this.setAPIKeyElement = redom.html("a", "Set OpenWeatherMap API key");
        this.clearAPIKeyElement = redom.html("a", "Clear OpenWeatherMap API key");

        this.setAPIKeyElement.addEventListener('click', _ => this.setAPIKey());
        this.clearAPIKeyElement.addEventListener('click', _ => this.clearAPIKey());
        this.el = redom.html("div", [this.lists, this.footer]);
    }

    update(localDateTime) {
        redom.setChildren(this.footer, this.appid ? this.clearAPIKeyElement : this.setAPIKeyElement);
        this.lists.forEach(timezoneList => timezoneList.update(localDateTime, this.appid));
    }

    get appid() {
        return window.localStorage.getItem('openWeatherMapAPIKey');
    }

    setAPIKey() {
        window.localStorage.setItem('openWeatherMapAPIKey', window.prompt("Set OpenWeatherMap API key", undefined));
        this.update(luxon.DateTime.local());
    }

    clearAPIKey() {
        window.localStorage.removeItem('openWeatherMapAPIKey');
        this.update(luxon.DateTime.local());
    }
}

class App {
    constructor() {
        this.main = new Main([
            new TimezoneList("Timezones", [
                new Timezone("Los Angeles", "America/Los_Angeles", "Los Angeles,US"),
                new Timezone("Boston, U.S.A.", "America/New_York", "Boston,US"),
                new Timezone("Reading, England", "Europe/London", "London,UK"),
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
