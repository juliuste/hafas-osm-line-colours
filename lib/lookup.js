'use strict'

const flatMap = require('lodash/flatMap')
const round = require('lodash/round')
const unionBy = require('lodash/unionBy')
const uniqBy = require('lodash/uniqBy')
const KDBush = require('kdbush')

const matchingProducts = {
	railway: ['nationalExp', 'national', 'regionalExp', 'regional', 'suburban', 'subway', 'tram'],
	train: ['nationalExp', 'national', 'regionalExp', 'regional', 'suburban', 'subway', 'tram'],
	subway: ['suburban', 'subway'],
	light_rail: ['suburban', 'subway', 'tram'],
	ferry: ['ferry'],
	bus: ['bus'],
	tram: ['tram']
}

const lineToPoints = line => {
	const locations = flatMap(line.routes, route => route.stopLocations)
	const products = matchingProducts[line.transitMode]
	const { ref } = line
	let { colour } = line
	if (!colour && line.wikidataClaims && Array.isArray(line.wikidataClaims.P465) && line.wikidataClaims.P465.length === 1) colour = `#${line.wikidataClaims.P465[0]}`

	const result = []
	if (ref && colour && products) {
		for (let location of locations) {
			const lon = round(location.longitude, 2) * 100
			const lat = round(location.latitude, 2) * 100
			for (let product of products) {
				result.push([lon, lat, { ref, backgroundColour: colour, textColour: null, product }])
			}
		}
	}

	return result
}

const linesToPoints = lines => unionBy(...lines.map(lineToPoints), x => JSON.stringify(x))

const createLookupFromPoints = points => {
	const index = new KDBush(points, p => p[0], p => p[1], 64, Int32Array)

	const lookup = (location, product) => {
		const lon = round(location.longitude, 2) * 100
		const lat = round(location.latitude, 2) * 100
		const results = index.within(lon, lat, 1).map(id => points[id][2]).filter(x => x.product === product)
		return uniqBy(results, x => `${x.ref}|${x.backgroundColour.toLowerCase()}|${(x.textColour || '').toLowerCase}`)
	}
	return lookup
}

const createLookupFromLines = lines => {
	const points = linesToPoints(lines)
	return createLookupFromPoints(points)
}

module.exports = { createLookupFromLines, createLookupFromPoints, linesToPoints }
