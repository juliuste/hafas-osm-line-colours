'use strict'

const get = require('lodash/get')
const tail = require('lodash/tail')
const uniq = require('lodash/uniq')
const intersection = require('lodash/intersection')
const condenseWhitespace = require('condense-whitespace')
const { createLookupFromLines, createLookupFromPoints, linesToPoints } = require('./lookup')

// remove all non-alphanumerical characters
// remove this long-term (but for now it seems to make sense to do this since the data quality is rather bad)
const cleanupLineName = name => name.toLowerCase().replace(/[^a-zA-Z0-9]+/gi, '')

const compareLineNames = (hafasName, osmName) => {
	const hafasNameCondensed = condenseWhitespace(hafasName)
	const osmNameCondensed = condenseWhitespace(osmName)
	if (!hafasNameCondensed || !osmNameCondensed) return false

	const hafasNameAlphanumerical = cleanupLineName(hafasNameCondensed)
	const osmNameAlphanumerical = cleanupLineName(osmNameCondensed)
	if (!hafasNameAlphanumerical || !osmNameAlphanumerical) return false

	const hafasNames = [hafasNameCondensed, hafasNameAlphanumerical]
	const osmNames = [osmNameCondensed, osmNameAlphanumerical]

	const hafasNameWithoutPrefix = condenseWhitespace(tail(hafasNameCondensed.split(' ')).join(' '))
	const osmNameWithoutPrefix = condenseWhitespace(tail(osmNameCondensed.split(' ')).join(' '))
	if (hafasNameWithoutPrefix) hafasNames.push(hafasNameWithoutPrefix)
	if (osmNameWithoutPrefix) osmNames.push(osmNameWithoutPrefix)

	const hafasNameWithoutPrefixAlphanumerical = cleanupLineName(hafasNameWithoutPrefix)
	const osmNameWithoutPrefixAlphanumerical = cleanupLineName(osmNameWithoutPrefix)
	if (hafasNameWithoutPrefixAlphanumerical) hafasNames.push(hafasNameWithoutPrefixAlphanumerical)
	if (osmNameWithoutPrefixAlphanumerical) osmNames.push(osmNameWithoutPrefixAlphanumerical)

	return (intersection(hafasNames, osmNames).length > 0)
}

const createDepartureOrArrivalLineColour = lookup => departureOrArrival => {
	const longitude = get(departureOrArrival, 'stop.location.longitude')
	const latitude = get(departureOrArrival, 'stop.location.latitude')
	const lineName = get(departureOrArrival, 'line.name')
	const product = get(departureOrArrival, 'line.product')
	if (!longitude || !latitude || !lineName || !product) return null
	const lines = lookup({ longitude, latitude }, product)
	const matchingLines = lines.filter(l => compareLineNames(lineName, l.ref))
	const matchingColours = uniq(matchingLines.map(l => l.colour.toLowerCase()))
	if (matchingColours.length === 1) return matchingColours[0]
	return null
}

const createLegLineColour = lookup => leg => {
	const originLongitude = get(leg, 'origin.location.longitude')
	const originLatitude = get(leg, 'origin.location.latitude')
	const destinationLongitude = get(leg, 'destination.location.longitude')
	const destinationLatitude = get(leg, 'destination.location.latitude')
	const lineName = get(leg, 'line.name')
	const product = get(leg, 'line.product')
	if (!originLongitude || !originLatitude || !destinationLongitude || !destinationLatitude || !lineName || !product) return null

	// @todo intersect origin lines and destination lines rather than just combine both
	// we're doing this for now since often lines are not mapped in their full length on osm so
	// doing this here would probably fail often

	const originLines = lookup({ longitude: originLongitude, latitude: originLatitude }, product)
	const matchingOriginLines = originLines.filter(l => compareLineNames(lineName, l.ref))

	const destinationLines = lookup({ longitude: destinationLongitude, latitude: destinationLatitude }, product)
	const matchingDestinationLines = destinationLines.filter(l => compareLineNames(lineName, l.ref))

	const matchingLines = [...matchingOriginLines, ...matchingDestinationLines]
	const matchingColours = uniq(matchingLines.map(l => l.colour.toLowerCase()))

	if (matchingColours.length === 1) return matchingColours[0]
	return null
}

const createLineColourClient = lookup => ({
	departureOrArrivalLineColour: createDepartureOrArrivalLineColour(lookup),
	legLineColour: createLegLineColour(lookup)
})

const createLineColourClientFromLines = lines => {
	return createLineColourClient(createLookupFromLines(lines))
}

const createLineColourClientFromPoints = points => {
	return createLineColourClient(createLookupFromPoints(points))
}

module.exports = createLineColourClientFromLines
module.exports.createLineColourClientFromPoints = createLineColourClientFromPoints
module.exports.linesToPoints = linesToPoints
