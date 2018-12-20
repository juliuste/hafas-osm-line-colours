# hafas-osm-line-colours

Match `legs` or `departures`/`arrivals` found with [`hafas-client`](https://github.com/public-transport/hafas-client) with OpenStreetMap transit line colours from datasets generated using [`osm-transit-lines`](https://github.com/juliuste/osm-transit-lines).

[![npm version](https://img.shields.io/npm/v/hafas-osm-line-colours.svg)](https://www.npmjs.com/package/hafas-osm-line-colours)
[![Build Status](https://travis-ci.org/juliuste/hafas-osm-line-colours.svg?branch=master)](https://travis-ci.org/juliuste/hafas-osm-line-colours)
[![Greenkeeper badge](https://badges.greenkeeper.io/juliuste/hafas-osm-line-colours.svg)](https://greenkeeper.io/)
[![dependency status](https://img.shields.io/david/juliuste/hafas-osm-line-colours.svg)](https://david-dm.org/juliuste/hafas-osm-line-colours)
[![license](https://img.shields.io/github/license/juliuste/hafas-osm-line-colours.svg?style=flat)](license)
[![chat on gitter](https://badges.gitter.im/juliuste.svg)](https://gitter.im/juliuste)

## Installation

```bash
npm install hafas-osm-line-colours
```

## Usage

```js
// the actual methods are wrapped in this creator method because we only want the search tree to be created once, not every time we actually search for a line
// takes a couple of seconds to create the client, depending on the size of your line dataset, but can then handle up to 250.000 queries per second
// note that the data will be stored in-memory, so double-check your hardware before loading a dataset that covers the entire planet
const createTransitLineColourClient = require('hafas-osm-line-colours')
const hafas = require('db-hafas')('user-agent')
const osmTransitLines = require('osm-transit-lines')

const main = async () => {
	const berlinBbox = { south: 52.3418234221, north: 52.6697240587, west: 13.0882097323, east: 13.7606105539 }
	const berlinTransitLines = await osmTransitLines(berlinBbox, { wikidata: true }) // see `osm-transit-lines` docs

	const { legLineColour, departureOrArrivalLineColour } = createTransitLineColourClient(berlinTransitLines) // methods exposed by this module

	// departures/arrivals
	const virchowKlinikumBerlin = '000730855'
	const [departure] = await hafas.departures(virchowKlinikumBerlin) // next train is a tram 50
	const departureLineColour = departureOrArrivalLineColour(departure) // '#36ab94' (colour of tram 50), null if no matching colour was found
	const [arrival] = await hafas.arrivals(virchowKlinikumBerlin) // next train is a tram M13
	const arrivalLineColour = departureOrArrivalLineColour(arrival) // '#00cc00' (colour of tram M13), null if no matching colour was found

	const zehlendorf = '008089098'
	const mexikoplatz = '008089023'
	const [journey] = await hafas.journeys(zehlendorf, mexikoplatz) // only leg is an S1 train
	const lineColour = legLineColour(journey.legs[0]) // '#d474ae' (colour of S1), null if no matching colour was found
}
```

## Contributing

If you found a bug or want to propose a feature, feel free to visit [the issues page](https://github.com/juliuste/hafas-osm-line-colours/issues).
