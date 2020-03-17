require('dotenv/config');
const express = require('express');
const cors = require('cors');
const firebase = require('firebase');
const Pusher = require('pusher');
const moment = require('moment');

app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
let port = process.env.PORT || 3001;

const firebaseConfig = {
    apiKey: "AIzaSyDC--2ZABBMAkCoZxmhBb05Ai5knZaDWGQ",
    authDomain: "lingkunganku-29e61.firebaseapp.com",
    databaseURL: "https://lingkunganku-29e61.firebaseio.com",
    projectId: "lingkunganku-29e61",
    storageBucket: "lingkunganku-29e61.appspot.com",
    messagingSenderId: "530229489689",
    appId: "1:530229489689:web:501e682c267dab6409fa88",
    measurementId: "G-V2Q3D3LGRH"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

const pusher = new Pusher({
    appId: '960068',
    key: 'f690560bf61bb6b8937a',
    secret: 'd40ed16586967cb3ff79',
    cluster: 'ap1',
    encrypted: true
});

app.get("/", (req, res) => {
    res.json({text: "Hello World!"});
});

app.get("/get/position/:idAlat", (req, res) => {
    db.collection("alat").doc("sampah").collection(req.params.idAlat).doc("position").get().then(sampahData => {
        db.collection("alat").doc("sungai").collection(req.params.idAlat).doc("position").get().then(sungaiData => {
            db.collection("alat").doc("udara").collection(req.params.idAlat).doc("position").get().then(udaraData => {
                res.json({
                    "sampah": sampahData.data(),
                    "sungai": sungaiData.data(),
                    "udara": udaraData.data()
                });
            })
        })    
    })
})

app.get("/get/data/:idAlat", (req, res) => {
    db.collection("history").doc(req.params.idAlat).get().then(snapshot => {
      console.log(snapshot.data());
      data = snapshot.data();
      db.collection("data").doc(data.lastData).get().then(hasil => {
          console.log(hasil.data());
          
            res.json({
                "idAlat": hasil.data().idAlat,
                "date": hasil.data().dateStr,
                "air": hasil.data().air,
                "udara": hasil.data().udara,
                "sampah": hasil.data().sampah,
                "dataAir": hasil.data().air,
                "dataUdara": hasil.data().udara,
                "dataSampah": hasil.data().sampah
            })
      })
    
    })
})

app.get("/up/data/:idAlat/:air/:udara/:sampah", (req, res) => {

    db.collection("data").add({
        idAlat: req.params.idAlat,
        sampah: req.params.sampah,
        udara: req.params.udara,
        air: req.params.air,
        date: firebase.firestore.FieldValue.serverTimestamp(),
        dateStr: moment().format("YYYY-MM-DDTHH:mm:ss")
    }).then(ref => {
        db.collection("history").doc(req.params.idAlat).collection("history").add({
            idAlat: req.params.idAlat,
            idData: ref.id,
            date: firebase.firestore.FieldValue.serverTimestamp()
        }).then(refs => {
            db.collection("history").doc(req.params.idAlat).set({
                lastData: ref.id
            })
            console.log('Added document on ', refs.id);
            pusher.trigger('data-notif', 'new-data', {
                "idAlat": req.params.idAlat,
                "date": moment().format("YYYY-MM-DDTHH:mm:ss"),
                "air": req.params.air,
                "udara": req.params.udara,
                "sampah": req.params.sampah,
                "dataAir": req.params.air,
                "dataUdara": req.params.udara,
                "dataSampah": req.params.sampah,                  
            });
            res.json({
                status: "sukses"
            })
        }).catch(err => {
            console.log(err);
            res.json({
                status: "error"
            })
        })
    })
    
})

app.listen(port, () => {
    console.log(port)
})