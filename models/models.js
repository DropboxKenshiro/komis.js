const {Sequelize, DataTypes, Model} = require("sequelize");
const sequelize = new Sequelize('komisjs', 'komisdb', 'example123', {host: 'mariadb', dialect: 'mariadb'});

class User extends Model {};
(async function () {
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
                isAlphanumeric: true
            }
        },
        firstName: {
            type: DataTypes.STRING(30),
            allowNull: false,
            validate: {
                isAlpha: true
            }
        },
        lastName: {
            type: DataTypes.STRING(30),
            allowNull: false,
            validate: {
                isAlpha: true
            }
        },
        dateOfBirth: DataTypes.DATEONLY,
        adressString: {
            type: DataTypes.STRING(100),
            allowNull: false,
            validate: {
                isAlphanumeric: true
            }
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
            validate: {
                isAlpha: true
            }
        },
        description: {
            type: DataTypes.TEXT,
            validate: {
                isAlpha: true
            }
        }
    }, {sequelize});
    await User.sync({alter: true});
})();

module.exports = {User};