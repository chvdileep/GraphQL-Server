const { GraphQLServer } = require('graphql-yoga')
let fs = require('fs')
var fetch = require('node-fetch')
var parser = require('xml2json')
var bunyan = require('bunyan')


var aList = []
var alistLength = 0

var tourData =
    '{"GolfDataFeed":{"Type":"Tournaments","Tournaments":{"Tournament":{"StartDate":"6/8/2018","Status":"Official","ID":2018030,"EndDate":"6/10/2018","Name":"ShopRite LPGA Classic presented by Acer","Tour":"LPGA"}},"Timestamp":"6/11/2018 3:38:28 AM"}}'


//
// fanAnalytics file name
var fanAnalyticsLog = "fanAnalytics_log.txt"
//
// check to make sure the logs dir is there before we open the log
var dir = './logs';
if (!fs.existsSync(dir)){
    fs.mkdirSync(dir);
}
//
// open the fan analytics logger
//
// this creates a logger that uses rolling log files. Roll the log file every 
// 6 min (I'll use 14 days '14d' in production).  The rolled file will be called fanAnalytics_log.txt.0
//
 var timecomputaion = (6 * 60 * 1000)
var timePeriod = timecomputaion.toString() + 'ms'
console.log(timePeriod)
var fanLogger = bunyan.createLogger({
    name: 'Fan Analytics',
    streams: [{
        type: 'rotating-file',
        period: timePeriod,
        count: 1,
        path: './logs/fanAnalytics_log.txt'
    }]
})


// read feed data from a very short feed file
aListFunc = () => {
    let fileName = 'aList.json'

    var raw = fs.readFileSync(fileName, 'utf8');
    let someText = raw.replace(/(\r\n\t|\n|\r\t)/gm, "");
    var zzz = JSON.parse(someText)
    // console.log(zzz.GolfDataFeed.Tournament.Locatorboard.Player)
    zzz.GolfDataFeed.Tournament.Locatorboard.Player.map(p => {
        aList.push(p)
    })
    alistLength = aList.length
    console.log("length of internal test list =", aList.length)
}

// read feed data from a file
fFunc = () => {
    // let fileName = 'shortFeed.json'
    let fileName = 'feed144.json'
    // let fileName = 'aList.json'

    var raw = fs.readFileSync(fileName, 'utf8');
    let someText = raw.replace(/(\r\n\t|\n|\r\t)/gm, "");
    var zzz = JSON.parse(someText)
    // console.log(zzz.GolfDataFeed.Tournament.Locatorboard.Player)

    return zzz.GolfDataFeed.Tournament.Locatorboard.Player
}

// read course data from a file
courseFunc = () => {
    console.log("loading course config")
    // let fileName = 'shoprite.json'
    // let fileName = 'indy.json'
    let fileName = 'September_coursefile-v5.json'
    let raw = fs.readFileSync(fileName, 'utf8')
    let someText = raw.replace(/(\r\n\t|\n|\r\t)/gm, "");
    let t = JSON.parse(someText)
    console.log("t-->", t.courseConfig.courseFileVersion)
    return someText
    // http://lpgaapplb-37320463.us-east-2.elb.amazonaws.com/config/activetournament
}


// 
// get the player list from a file, sort it and return first 10
sortAndReturn10Test = () => {
    console.log("players LPGA top 10 sorted: Test")
    let list = fFunc()
    // console.log("list->", list)
    let sortedList = list.sort(function (a, b) {

        return a.Rank - b.Rank
    })
    // console.log("sorted->", sortedList.length)
    let listLength = 0
    
    if (sortedList.length < 10) {
        listLength = sortedList.length
    } else {
        listLength = 10
    }
    let completeList = []
    for (let j = 0; j < listLength; j++) {
        // console.log(sortedList[j])
        completeList.push(sortedList[j])
    }
    return completeList
}

//
// get player list from "backend", sort it and return first 10
sortAndReturn10 = () => {
    console.log("players LPGA top 10 sorted")
    return fetch(baseURL)
        .then(res => res.json())
        .then(res => {
            // console.log(res.GolfDataFeed.Tournament.Locatorboard.Player)
            let sortedList = res.GolfDataFeed.Tournament.Locatorboard.Player.sort(function (a, b) {
 
                return a.Rank - b.Rank
            })
            // console.log("sorted->", sortedList)
            let completeList = []
            for (let j = 0; j < 10; j++) {
                // console.log(sortedList[j])
                completeList.push(sortedList[j])
            }
            return completeList
        })
}

// this runs when the server 1st starts to populate one of the testing interface
aListFunc()

const baseURL = "http://localhost:5000/active"

// this will get me Rank, CumToPar, Country: for a specific player
const lpgaXML_PlayerDetail = 'http://services.lpgascoring.com/ws/1.5/Leaderboards/?clientId=70874eab-b701-47bb-be91-a42b2cb70da6'

// raw LPGA XML feed
var lpgaXML_URL = 'http://services.lpgascoring.com/ws/1.5/locatorboards/players?clientId=70874eab-b701-47bb-be91-a42b2cb70da6'

// ECS based production feed
const awsURL = 'http://lpgaapplb-37320463.us-east-2.elb.amazonaws.com/api/locatorboards/players'

// ECS based test feed
const awsTestFeed = 'http://lpgaapplb-37320463.us-east-2.elb.amazonaws.com/api/locatorboards/players/test'


// 2
const resolvers = {
    Query: {
        /*
        query {
            version
        }
        */
        version: () => {
            // console.log("tt->", tourData)
            return tourData
        },
        /*
        query {
            players {
                FirstName
                LastName
                Hole
                HoleLocation
                ID
                
            }
        }
        */
        players: () => aList,
        /*
        query {
            playersTest {
                FirstName
                LastName
                Hole
                HoleLocation
                ID
                
            }
        }
        */
        playersTest: () => fFunc(),
        /*
        query {
            playersLPGA {
                FirstName
                LastName
                Hole
                HoleLocation
                ID
                
            }
        }
        */
        playersLPGA: () => {
            console.log("players LPGA")
            return fetch(awsURL)
                .then(res => res.json())
                .then(res => {
                    return res.GolfDataFeed.Tournament.Locatorboard.Player
                })
        },

        /*
        query {
            playersLPGATest {
                FirstName
                LastName
                Hole
                HoleLocation
                ID
                
            }
        }
        */
        playersLPGATest: () => {
            console.log("players LPGA test")
            return fetch(awsTestFeed)
                .then(res => res.json())
                .then(data => {
                    return data.GolfDataFeed.Tournament.Locatorboard.Player
                })
        },

        /*
        query {
            playersLPGAXML {
                FirstName
                LastName
                Hole
                HoleLocation
                ID

            }
        }
        */
        playersLPGAXML: () => {
            let playerDetails = new Array()

            return fetch(lpgaXML_PlayerDetail)
                .then(res => res.text())
                .then(res => parser.toJson(res))
                .then(res => {
                    // console.log(JSON.parse(res).GolfDataFeed.Tournament.Leaderboard.Player)
                    JSON.parse(res).GolfDataFeed.Tournament.Leaderboard.Player.map(p => {
                        playerDetails[p.ID] = p
                    })
                    // console.log("-->", typeof(playerDetails))

                    return fetch(lpgaXML_URL)
                        .then(res => res.text())
                        .then(res => parser.toJson(res))
                        .then(res => {
                            JSON.parse(res).GolfDataFeed.Tournament.Locatorboard.Player.map(pp => {
                                pp.Rank = playerDetails[pp.ID].Rank
                                pp.CumulativeToPar = playerDetails[pp.ID].CumulativeToPar
                                pp.RoundToPar = playerDetails[pp.ID].RoundToPar
                                // console.log("oo->", pp)
                            })
                            return JSON.parse(res).GolfDataFeed.Tournament.Locatorboard.Player
                        })
                })
            // console.log("in ere")
        },

        allConfigs: () => courseFunc(),
        // {
        //     return fetch('http://lpgaapplb-37320463.us-east-2.elb.amazonaws.com/config/activetournament')
        //         .then(res => res.json())
        //         .then(res => {
        //             console.log("res->", Object.keys(res))
        //             return JSON.stringify(res)
        //         })
        // },

        tournamentStatus: () => {
            url = 'http://lpgaapplb-37320463.us-east-2.elb.amazonaws.com/api/tournaments/test'
            // let url = 'http://localhost:5000'
            console.log("get status", url)
            return fetch(url)
                .then(resp => resp.json())
                .then(resp => {
                    // let v = JSON.parse(resp)

                    let status = resp.GolfDataFeed.Tournaments.Tournament.Status
                    console.log("feed status->", status)
                    return status
                })
        },
        //
        // query { basicAnalytics(obj: String - for example: {time/date, id, bool})}
        //
        basicAnalytics: (parent, args) => {
            try {
                console.log("args->", args.obj)
                fanLogger.info(args.obj)

                return args
            } catch(error) {
                console.error("too much load on analytics service", error)
            }
        },
        playersTop10Sorted: () => sortAndReturn10Test()
    },

    Player2: {
        ID: (root) => root.ID,
        FirstName: (root) => root.FirstName,
        LastName: (root) => root.LastName,
        Hole: (root) => { return root.Hole === null ? "" : root.Hole },
        HoleLocation: (root) => { return root.HoleLocation },
        Rank: (root) => { return root.Rank === null ? "" : root.Rank },
        CumulativeToPar: (root) => { return root.CumulativeToPar === null ? "" : root.CumulativeToPar }
    },

    /*
        usage: in graphiql

        mutation {
            createPlayer(firstName: "Marcus", lastName: "Quarles", hole: 4, holeLocation: "FWY") {
                FirstName
            }
        }

    */
    Mutation: {
        createPlayer: (root, args) => {
            console.log("args->", args)
            const player = {
                ID: (alistLength + 1),
                FirstName: args.firstName,
                LastName: args.lastName,
                Hole: args.hole,
                HoleLocation: args.holeLocation,
                RoundToPar: 1,
                CumulativeToPar: "3",
                Rank: "2",
                Country: "USA"
            }
            aList.push(player)
            return player
        },

        /*
        mutation {
            updatePlayerPositionOnCourse(id: 98139, hole: 5, holeLocation: "TEE") {
                FirstName
                LastName
                Hole
                HoleLocation
            }
        }
        */
        updatePlayerPositionOnCourse: (root, args) => {
            console.log("Update player Position->", args)
            let p = aList.find(i => { return i.ID == args.id })
            p.Hole = args.hole
            p.HoleLocation = args.holeLocation
            return p
        }
    }

}

// 3
const server = new GraphQLServer({
    typeDefs: './src/schema.graphql',
    resolvers,
})
server.start(() => console.log(`Server is running on http://localhost:4000`))


