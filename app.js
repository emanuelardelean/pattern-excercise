'use strict'
const express = require('express')
const app = express()
const port = 5000
app.set('json spaces', 20);

// GET /people
app.get('/people', async (req, res) => {
  const fieldName = req.query.sortBy

  const people = (await loadAllPages("https://swapi.dev/api/people/"))
    .map(o => { o.height = getNumber(o.height); o.mass = getNumber(o.mass); return o })
    .sort(sortByField(fieldName))

  res.send(people)
})

// GET /planets
app.get('/planets', async (req, res) => {

  const planets = await loadAllPages("https://swapi.dev/api/planets/")
  const modifiedPlanets = await Promise.all(planets.map(async (planet) => {
    planet.residents = await Promise.all(planet.residents.map(async (oUrl) => await urlToName(oUrl)))
    return planet
  }))

  res.send(modifiedPlanets)
})


app.listen(port, () => {
  console.log(`Exercise listening on port: ${port}`)
})

// ----------------------------------------------------------------------------------------

const loadAllPages = async (url) => {
  let nextUrl = url
  let data = []
  while (nextUrl) {
    console.log(nextUrl)
    let { next, results } = await getData(nextUrl)
                                    
    nextUrl = next
    data = [...data, ...results]
  }

  return data
}

// GET api call
const getData = async (url) => await fetch(url, { method: "GET" })
  .catch(err => { console.log(err); throw err; })
  .then(response => response.json()) 



const urlToName = function () {
  const cacheMap = new Map()

  return async function (oUrl) {
    if (oUrl === null || oUrl === undefined)
      return null

    if (!cacheMap.has(oUrl)) {
      const { name } = await getData(oUrl)
      cacheMap.set(oUrl, name)
    }

    return cacheMap.get(oUrl)
  }
}()


const sortByField = (field) => {
  return function (a, b) {
    if (field === null || field === undefined)
      return 0 // do not sort
    if (a[field] === null || a[field] === undefined) // set at end
      return 1
    if (b[field] === null || b[field] === undefined) // set at end
      return -1

    return (a[field] < b[field]) ? -1 : (a[field] > b[field]) ? 1 : 0
  }
}

const getNumber = (nr) => {
  const num = parseInt(nr)
  if (isNaN(num))
    return null

  return num
}

