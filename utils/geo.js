const {Client} = require("@googlemaps/google-maps-services-js");

async function locateAddress(cityName, streetName) {
    const client = new Client({});
    const options = {
        params: {
        key: process.env.MAPS_API_KEY,
        address: `${streetName}${streetName !== null ? ',' : ''}${cityName}`
        }
    }
    const geodata = await client.geocode(options);
    return [geodata.data.results[0].geometry.location.lat, geodata.data.results[0].geometry.location.lng]
}

const geoDegree = 111200; // in meters

function geoCoordsDistance(firstPoint, secondPoint) {
    /*
    This function uses simplified model, treating Earth as a plane, calculating difference
    in degrees and converting it into meters.
    For distances around these like on our site, this approximations should be enough.
    */
    return Math.sqrt(Math.pow(secondPoint[0]-firstPoint[0],2)+Math.pow(secondPoint[1]-firstPoint[1],2)) * geoDegree;
}

module.exports = {locateAddress, geoCoordsDistance};