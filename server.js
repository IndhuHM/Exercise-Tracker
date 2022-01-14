const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config();
const bodyParser = require('body-parser');
const mongoose = require('mongoose');


app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors());
app.use(express.static('public'));

mongoose.connect(
	process.env['DB_URI'],
	{ useNewUrlParser: true, useUnifiedTopology: true }
);
const personSchema = new mongoose.Schema({
	username: { type: String, required: true, unique: true}
});
const Person = mongoose.model('Person', personSchema);
const exerciseSchema = new mongoose.Schema({
  userId: {type: String, required: true},
	description: {type: String, required: true},
	duration: {type: Number,required: true},
	date: {type: Date, required: false}
});
const Exercise = mongoose.model('Exercise', exerciseSchema);

app.post('/api/users', function(req, res) {
	const newPerson = new Person({ username: req.body.username });
  
	newPerson.save(function(err, data) {
		if (!data) {
			res.send('Username already taken');
		} else {
			res.json({
				username: data.username,
				_id: data.id
			});
		}
	});
});


app.get('/api/users', (req,res) =>{
  Person.find({},(err,users)=>{
    if (err) return console.error(err);
    let result =[];
    users.forEach(user => {
      result.push({username: user.username, _id: user._id})
    });
    res.json(result)
  });
});


app.post('/api/users/:_id/exercises', (req,res)=>{
  const userId=req.params._id; 
  const description=req.body["description"];
  const duration=req.body["duration"];
  let date=req.body["date"];

  if(date===""|| typeof req.body["date"] === 'undefined'){
    date= new Date().toDateString();
  }
  else{ 
    date= new Date(req.body["date"]).toDateString();
  }
  
 Person.findById(userId, function(err,data){
   if(!data){
     res.send('Unknown userId');
   }
   const newExercise = new Exercise({userId, description, duration, date});
  
   const username= data.username;
  newExercise.save(function(err, data) {
   res.json({"_id": userId, username, date ,duration: parseInt(duration), description});
  })
 })
});

app.get('/api/users/:_id/logs', function(req, res){
  const userId= req.params._id;
const {from, to, limit}=req.query;

   Person.findById(userId, function(err,data){
   if(!data){
     res.send('Unknown userId');
   }
   const username= data.username;
  console.log({"from": from, "to": to, "limit": limit})
Exercise.find({userId}, {date: {$gte:new Date(from), $lte: new Date(to)}}).select(["id", "description", "duration", "date"]).limit(+limit).exec( function(err,data){
  let log= data.map(item=>{
    let dateFormatted= new Date(item.date).toDateString();
    return{ description: item.description, duration: item.duration, date: dateFormatted}
  })
  if(!data){
    res.json({"userId": userId, "username": username, "count": 0, "log": []})
  }else{
    res.json({"userId": userId, "username": username, "count": data.length, "log": log})
  }
})
   });
});

app.get('/', (req, res) => {
	res.sendFile(__dirname + '/views/index.html');
});

const listener = app.listen(process.env['PORT'] || 3000, () => {
	console.log('Your app is listening on port ' + listener.address().port);
});
