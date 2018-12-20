'use strict'

const tapeWithoutPromise = require('tape')
const addPromiseSupport = require('tape-promise').default
const tape = addPromiseSupport(tapeWithoutPromise)
const osmLines = require('osm-transit-lines')
const hafas = require('db-hafas')('hafas-osm-line-colours')
const { BE } = require('german-states-bbox')
const flatMap = require('lodash/flatMap')

const createLineColourClient = require('.')

// @todo other cities/areas
tape('hafas-osm-line-colours', async t => {
	const bboxBerlin = { west: BE.minLon, east: BE.maxLon, south: BE.minLat, north: BE.maxLat }
	const linesBerlin = await osmLines(bboxBerlin, { wikidata: true })
	t.ok(linesBerlin.length >= 20, 'precondition')
	const berlinClient = createLineColourClient(linesBerlin)

	// departures at mexikoplatz
	const [mexikoplatz] = await hafas.locations('Mexikoplatz')
	t.ok(mexikoplatz.id, 'precondition')
	const departuresAtMexikoplatz = await hafas.departures(mexikoplatz.id, { duration: 8 * 60 })
	t.ok(departuresAtMexikoplatz.length >= 5, 'precondition')
	const s1Departure = departuresAtMexikoplatz.find(d => d.line.name === 'S 1')
	t.ok(s1Departure, 'precondition')
	const s1Colour = berlinClient.departureOrArrivalLineColour(s1Departure)
	t.ok(s1Colour === '#d474ae', 's1 mexikoplatz colour')

	// departures at osloer
	const [osloer] = await hafas.locations('Osloer Str. Berlin')
	t.ok(osloer.id, 'precondition')
	const departuresAtOsloer = await hafas.departures(osloer.id, { duration: 8 * 60 })
	t.ok(departuresAtOsloer.length >= 5, 'precondition')
	const u8Departure = departuresAtOsloer.find(d => d.line.name === 'U 8')
	t.ok(u8Departure, 'precondition')
	const u8Colour = berlinClient.departureOrArrivalLineColour(u8Departure)
	t.ok(u8Colour === '#055a99', 'u8 osloer colour')

	// departures at osloer
	const [virchow] = await hafas.locations('Virchow-Klinikum')
	t.ok(virchow.id, 'precondition')
	const departuresAtVirchow = await hafas.departures(virchow.id, { duration: 8 * 60 })
	t.ok(departuresAtVirchow.length >= 5, 'precondition')
	const tram50Departure = departuresAtVirchow.find(d => d.line.name === 'STR 50')
	t.ok(tram50Departure, 'precondition')
	const tram50Colour = berlinClient.departureOrArrivalLineColour(tram50Departure)
	t.ok(tram50Colour === '#36ab94', 'tram 50 virchow colour')

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
	const tram63Leg = legs.find(l => l.line.name === 'STR 63')
	t.ok(tram63Leg, 'precondition')
	const tram63Colour = berlinClient.legLineColour(tram63Leg)
	t.ok(tram63Colour === '#009999', 'tram 63 adlershof->spindlersfeld colour')

	t.end()
})
