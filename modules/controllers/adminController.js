const Boom = require('boom')

const Lib = require('../libs/commFunctions')
const dbQuery = require('../databaseInteractions')
const api_reference = "Admin_Controller"

module.exports.login = async function (creds) {
    const loggerData = {
        api_reference: api_reference,
        event: "/admin/login",
        body: creds
    }
    winstonLogger.info(loggerData)
    try {
        let sql = `SELECT * FROM Users WHERE email = ?`
        let params = [creds.email]
        let adminInfo = await dbQuery.executeSQLQuery(sql, params)
        if (!adminInfo.length) {
            throw Boom.unauthorized(Constant.errorMessages.invalidCreds)
        }
        let password = adminInfo[0].password
        await Lib.comparePassword(password, creds.password)
        const dataToSign = {
            id: adminInfo[0].admin_id,
            role: 'Admin',
            creationTime: new Date(),
        }
        const expireTime = '1d'
        const accessToken = await Lib.generateToken(dataToSign, expireTime);

        let data = adminInfo[0];
        return Lib.successResponse(data);
    } catch (error) {
        if (error.isBoom) {
            const err = error.output.payload;
            return err
        } else {
            winstonLogger.error("Unknown Error for the api ", api_reference, error)
            const err = Boom.expectationFailed("Expected this to work :(");
            throw err
        }
    }
}

module.exports.accessTokenLogin = async function (accessToken, adminData) {
    const loggerData = {
        api_reference: api_reference,
        event: "/admin/access_token_login",
        body: adminData
    }
    winstonLogger.info(loggerData)
    try {
        let sql = `SELECT * FROM tb_admins WHERE admin_id = ?`
        let params = [adminData.id]
        let adminInfo = await dbQuery.executeSQLQuery(sql, params)
        if (!adminInfo.length) {
            throw Boom.unauthorized(Constant.errorMessages.invalidCreds)
        }

        let data = {
            id: adminInfo[0].admin_id,
            firstName: adminInfo[0].first_name,
            lastName: adminInfo[0].last_name,
            email: adminInfo[0].email,
            accessToken: accessToken
        };
        return Lib.successResponse(data);
    } catch (error) {
        if (error.isBoom) {
            const err = error.output.payload;
            return err
        } else {
            winstonLogger.error("Unknown Error for the api ", api_reference, error)
            const err = Boom.expectationFailed("Expected this to work :(");
            throw err
        }
    }
}