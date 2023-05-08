import express from "express"
import mysql from "mysql"
import bodyParser from "body-parser"
import multer from "multer"
import cors from "cors"
import bcrypt from "bcrypt"
import generator from "generate-password"
import expressSession from "express-session"
import cookieParser from "cookie-parser"
const PORT = 4000;
const upload = multer()
const connection = mysql.createConnection({
    host: "127.0.0.1",
    user: "root",
    database: "node_basics",
    password: "Daskis009"
});
const SECRET = "qwerty"
const app = express()
app.use(bodyParser.json())
app.use(cookieParser(SECRET))
app.use(expressSession({
    secret: SECRET
}))
app.use(upload.array()); 
app.use(express.static('public'));
app.use(cors())
app.post("/", (req, res) => {
    const data = {
        name: false,
        email: false,
        birthYear: false,
        sex: false,
        limbs: false,
        biography: false,
        superpower: false
    }
    const NAME_REGEXT = /^[А-ЯЁ][а-яё]+$/
    const superpower = {
        levitation: false,
        immortality: false,
        passing: false
    }
    const EMAIL_REGEXP = /^(([^<>()[\].,;:\s@"]+(\.[^<>()[\].,;:\s@"]+)*)|(".+"))@(([^<>()[\].,;:\s@"]+\.)+[^<>()[\].,;:\s@"]{2,})$/iu;
    if (req.body) {
        if (!NAME_REGEXT.test(req.body.name)) {
            data.name = true;
        } 
        if (!EMAIL_REGEXP.test(req.body.email)) {
            data.email = true;
        }
        if (!req.body.birthYear) {
            data.birthYear = true;
        }
        if (!req.body.sex) {
            data.sex = true;
        }
        if (!req.body.limbs) {
            data.limbs = true;
        }
        if (req.body.superpower) {
            for (let item of req.body.superpower) {
                superpower[item.value] = true
            }
        } 
        if (req.body.superpower.length == 0) {
            data.superpower = true
        }
        if (!req.body.biography) {
            data.biography = true;
        }
        let f = false;
        for (const [key, value] of Object.entries(data)) {
            if (value) {
                f = true
            }
        }
        if (f) {
            return res.json({fail: data})
        } else {
            if (req.headers.authorisation) {
                console.log(req.headers.authorisation)
                connection.query(`UPDATE peoples 
                    SET
                    name = "${req.body.name.toString()}",
                    email = "${req.body.email.toString()}",
                    birthYear = "${req.body.birthYear.toString()}",
                    sex = "${req.body.sex.toString()}",
                    limbs = "${req.body.limbs.toString()}",
                    levitation = "${Boolean(superpower.levitation)}",
                    immortality = "${Boolean(superpower.immortality)}",
                    passing = "${Boolean(superpower.passing)}",
                    biography = "${req.body.biography.toString()}"
                    WHERE id = ${req.headers.authorisation};
                `)
                const resData = Object.assign(req.body, superpower)
                return res.json({success: resData, appointment: "edit"})
            }
            else {
                const password = generator.generate({
                    length: 10,
                    numbers: true
                })
                bcrypt.hash(password, 10)
                    .then(hash => {
                        req.session.hash = hash
                        const userInfo = {
                            login: (req.body.name + Date.now()),
                            password: password
                        }
                        const answerData = Object.assign(superpower, req.body, userInfo)
                        delete answerData.superpower
                        
    
                    connection.query(`INSERT INTO peoples (name, email, birthYear, sex, limbs, levitation, immortality, passing, biography)
                        VALUES ("${req.body.name.toString()}", "${req.body.email.toString()}", "${req.body.birthYear.toString()}", "${req.body.sex.toString()}","${req.body.limbs.toString()}",${Boolean(superpower.levitation)},${Boolean(superpower.immortality)},${Boolean(superpower.passing)},"${req.body.biography.toString()}");`)
                        connection.query('SELECT id FROM peoples ORDER BY id DESC LIMIT 1;', (err, result) => {
                            connection.query(`INSERT INTO users_info (user_id, login, password) values ('${result[0].id}', '${userInfo.login}', '${hash}')`)
                            return res.json({success: userInfo, id: result[0].id, info: answerData})
                        })
                        })
            }
            
                
            
        }
        
        
    }
})
app.post("/auth", (req, res) => {
    connection.query(`SELECT password, user_id from users_info WHERE login = ?;`, req.body.login, (err, data) => {
        bcrypt.compare(req.body.password, data[0].password, (error, result) => {
            try {
                if (result) {
                    connection.query(`SELECT * FROM peoples where id = ?`, data[0].user_id, (er, info) => {
                        res.json(info)
                    })
                }
            }
            catch (e) {
                console.log(error)
            }
        })
    })
})

app.listen(PORT, () => {
    connection.connect((err) => {
        if (err) {
            console.log(err)
        }
    })
})
