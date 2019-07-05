'use strict'

const tapeWithoutPromise = require('tape')
const addPromiseSupport = require('tape-promise').default
const tape = addPromiseSupport(tapeWithoutPromise)
const osmLines = require('osm-transit-lines')
const hafas = require('db-hafas')('hafas-osm-line-colours')
const { BE } = require('german-states-bbox')
const flatMap = require('lodash/flatMap')

const createLineColourClient = require('.')
const { createLineColourClientFromPoints, linesToPoints } = require('.')

// @todo other cities/areas
tape('hafas-osm-line-colours', async t => {
	const bboxBerlin = { west: BE.minLon, east: BE.maxLon, south: BE.minLat, north: BE.maxLat }
	const linesBerlin = await osmLines(bboxBerlin, { wikidata: true })
	t.ok(linesBerlin.length >= 20, 'precondition')

	const berlinClient = createLineColourClient(linesBerlin)
	const pointsBerlin = linesToPoints(linesBerlin)
	const berlinClientFromPoints = createLineColourClientFromPoints(pointsBerlin)
	const clients = [berlinClient, berlinClientFromPoints]

	for (let client of clients) {
		// departures at mexikoplatz
		const [mexikoplatz] = await hafas.locations('Mexikoplatz')
		t.ok(mexikoplatz.id, 'precondition')
		const departuresAtMexikoplatz = await hafas.departures(mexikoplatz.id, { duration: 8 * 60 })
		t.ok(departuresAtMexikoplatz.length >= 5, 'precondition')
		const s1Departure = departuresAtMexikoplatz.find(d => d.line.product === 'suburban' && d.line.name === 'S 1')
		t.ok(s1Departure, 'precondition')
		const s1Colour = client.departureOrArrivalLineColour(s1Departure)
		t.deepEqual(s1Colour, { backgroundColour: '#d474ae', textColour: null }, 's1 mexikoplatz colour')

		// departures at moritzplatz
		const [moritzplatz] = await hafas.locations('Moritzplatz Berlin')
		t.ok(moritzplatz.id, 'precondition')
		const departuresAtMoritzplatz = await hafas.departures(moritzplatz.id, { duration: 8 * 60 })
		t.ok(departuresAtMoritzplatz.length >= 5, 'precondition')
		const u8Departure = departuresAtMoritzplatz.find(d => d.line.product === 'subway' && d.line.name === 'U 8')
		t.ok(u8Departure, 'precondition')
		const u8Colour = client.departureOrArrivalLineColour(u8Departure)
		t.deepEqual(u8Colour, { backgroundColour: '#055a99', textColour: null }, 'u8 moritzplatz colour')

		// departures at virchow
		const [virchow] = await hafas.locations('Virchow-Klinikum')
		t.ok(virchow.id, 'precondition')
		const departuresAtVirchow = await hafas.departures(virchow.id, { duration: 8 * 60 })
		t.ok(departuresAtVirchow.length >= 5, 'precondition')
		const tram50Departure = departuresAtVirchow.find(d => d.line.product === 'tram' && d.line.name === '50')
		t.ok(tram50Departure, 'precondition')
		const tram50Colour = client.departureOrArrivalLineColour(tram50Departure)
		t.deepEqual(tram50Colour, { backgroundColour: '#36ab94', textColour: null }, 'tram 50 virchow colour')

		const [adlershof] = await hafas.locations('Adlershof')
		t.ok(adlershof.id, 'precondition')
		const [spindlersfeld] = await hafas.locations('Spindlersfeld')
		t.ok(spindlersfeld.id, 'precondition')
		const journeys = await hafas.journeys(adlershof.id, spindlersfeld.id, {
			duration: 8 * 60,
			transfers: 0,
			results: 5
		})
		const legs = flatMap(journeys, j => j.legs)
		const tram63Leg = legs.find(l => l.line.product === 'tram' && l.line.name === '63')
		t.ok(tram63Leg, 'precondition')
		const tram63Colour = client.legLineColour(tram63Leg)
		t.deepEqual(tram63Colour, { backgroundColour: '#009999', textColour: null }, 'tram 63 adlershof->spindlersfeld colour')
	}

	t.end()
})
