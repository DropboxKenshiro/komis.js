const { findPlaceFromText } = require("@googlemaps/google-maps-services-js/dist/places/findplacefromtext");
const {Sequelize, DataTypes, Model} = require("sequelize");
const sequelize = new Sequelize('komisjs', 'komisdb', 'example123', {host: 'mariadb', dialect: 'mariadb'});

const allCharRegex = /^[\p{L}0-9,.()!%@;:'"/?]+$/iu;
const allWordRegex = /^[\p{L}\s0-9,.()!%@;:'"/?]+$/iu;

class User extends Model {};
User.init({
    email: {
        type: DataTypes.STRING,
        primaryKey: true,
        allowNull: false,
        validate: {
            isEmail: true
        }
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            isAlphanumeric: true
        }
    },
    salt: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            is: /^[0-9a-f-]{36}$/i
        }
    },
    firstName: {
        type: DataTypes.STRING(30),
        allowNull: false,
        validate: {}
    },
    lastName: {
        type: DataTypes.STRING(30),
        allowNull: false,
        validate: {}
    },
    dateOfBirth: DataTypes.DATEONLY,
    adressString: {
        type: DataTypes.STRING(100),
        allowNull: false,
        validate: {}
    },
    zipCode: {
        type: DataTypes.STRING,
        allowNull: false,
        validate:{
            is: /^\d{2}-\d{3}$/i // Polish zip code format: XX-XXX
        }
    },
    location: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {}
    },
    phoneNumber: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            isNumeric: true
        }
    },
    description: {
        type: DataTypes.TEXT,
        validate: {}
    }
}, {sequelize});

class EngineType extends Model {};
EngineType.init({
    name: {
        type: DataTypes.STRING(30),
        primaryKey: true,
        allowNull: false,
        validate: {
            is: allCharRegex
        }
    }
}, {sequelize});

class Country extends Model {};
Country.init({
    name: {
        type:DataTypes.STRING(30),
        primaryKey: true,
        allowNull: false,
        validate: {
            is: allWordRegex
        }
    },
    trigram: {
        type: DataTypes.STRING(3),
        allowNull: false,
        validate: {
            is: /[A-Z]{3}/i
        }
    }
}, {sequelize});

class Manufactuer extends Model {};
Manufactuer.init({
    name: {
        type: DataTypes.STRING(30),
        primaryKey: true,
        allowNull: false,
        validate: {
            is: allCharRegex
        }
    }
}, {sequelize});

Country.hasMany(Manufactuer);

class CarModel extends Model {};
CarModel.init({
    name: {
        type: DataTypes.STRING(30),
        primaryKey: true,
        allowNull: false,
        validate: {
            is: /^[\p{L} \0-9()]+$/i
        }
    },
    manufactuer: {
        type: DataTypes.STRING(30),
        primaryKey: true,
        allowNull: false,
        validate: {
            is: allCharRegex
        }
    }}, {sequelize});

Manufactuer.hasMany(CarModel, {foreignKey: 'manufactuer'});

class CarOffer extends Model {};
CarOffer.init({
    offerId: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        allowNull: false,
        autoIncrement: true,
    },
    title: {
        type: DataTypes.STRING(50),
        validate: {
            is: allWordRegex
        }
    },
    image: {
        type: DataTypes.STRING,
        validate: {
            isUrl: true
        }
    },
    price: {
        type: DataTypes.DECIMAL(12,2),
        allowNull: false,
        validate: {
            min: 1
        }
    },
    modelYear: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
            min: 1900,
            max: 3000
        }
    },
    mileage: {
        type: DataTypes.BIGINT,
        allowNull: false,
        validate: {
            min: 1
        }
    },
    engineCapacity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
            min: 10
        }
    },
    description: {
        type: DataTypes.STRING(500),
        validate: {
            is: allWordRegex 
        }
    },
    latitude: { // notice: positive numbers are degrees north, negative are degrees south
        type: DataTypes.DECIMAL(9,6),
        allowNull: false,
        validate: {
            max: 90,
            min: -90
        }
    },
    longitude: { // notice: positive numbers are degrees east, negative are degrees west
        type: DataTypes.DECIMAL(9,6),
        allowNull: false,
        validate: {
            max: 180,
            min: -180
        }
    }}, {sequelize});

Manufactuer.hasMany(CarOffer);
CarModel.hasMany(CarOffer);
EngineType.hasMany(CarOffer);
User.hasMany(CarOffer);
CarOffer.belongsTo(User);

class FollowedOffer extends Model{};
FollowedOffer.init({}, {sequelize});
FollowedOffer.belongsTo(CarOffer);
FollowedOffer.belongsTo(User);

(async function () {
    await sequelize.sync({alter: true});
})();

module.exports = {sequelize, User, CarOffer, Country, Manufactuer, FollowedOffer, EngineType};