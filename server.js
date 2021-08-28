const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const mongoose = require('mongoose')

app.use(express.json());
app.use(express.urlencoded({ extended: true }))

app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

mongoose.connect(process.env.MONGO_URI, { 
  useNewUrlParser: true, 
  useUnifiedTopology: true, 
  useCreateIndex: true, 
  autoIndex: true
});

const userSchema = new mongoose.Schema({
  username: {type: String, unique: true}, 
  logs: [{type: mongoose.Schema.Types.ObjectId, ref:'Exercise'}]
})
const exerciseSchema = new mongoose.Schema({
  userId: {type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User'}, 
  description: {type: String, required: true}, 
  duration: {type: Number, required: true}, 
  date: Date
})

const User = mongoose.model('User', userSchema)
const Exercise = mongoose.model('Exercise', exerciseSchema)


app.post('/api/users', (req, res) => {

  const newUser = new User({username: req.body.username})
  
  newUser.save((err, data) => {
    if(err){
      res.send("username taken")
    } else {
      res.json({username: data.username, _id: data.id})
    }
  })
})

app.get('/api/users', (req, res) => {

  User.find((err, data) => {
    if(data){
      res.json(data)
    }else{
      res.json(err)
    }
  })

})

app.post('/api/users/:_id/exercises', async (req, res) => {
 
  const id = req.params._id
  let {
    description,
    duration,
    date
  } = req.body

  console.log(date)

  if(!date){
    date = new Date()
  } else {
    date = new Date(date)
  }

  console.log(date);
 
  const user = await User.findById(id, (err, data) => {
    if (err){
      res.send("Error de ID")
    }
  })
  
  const newExercise = new Exercise({
    userId: user._id, 
    description: description, 
    duration: duration,
    date: date
  })

   await newExercise.save((err, data) => {
     if (err) {
       res.send("Error")
     }
  })    
 
  user.logs = user.logs.concat(newExercise._id)
  await user.save((err, data) => {
      if (err) {
        res.send("Error al guardar")
      }else{
        res.json({
          "_id": user._id,
          "username": user.username,
          "date": newExercise.date.toDateString(),
          "duration": +newExercise.duration,
          "description": newExercise.description
        })
      }    
  })    
})

app.get('/api/users/:_id/logs', (req, res) => {
  const id = req.params._id
  const {from, to, limit} = req.query
  console.log(from, to, limit);
  User.findById(id, (err, data) => {
    if (!data){
      res.send("error")
    } else{
      let {_id, username, logs} = data

      if(from){
        const fromDate = new Date(from)
        logs = logs.filter((exe) => new Date(exe.date) > fromDate)
      }

      if(to){
        const toDate = new Date(to)
        logs = logs.filter((exe) => new Date(exe.date) < toDate)
      }

      if(limit){
       logs = logs.slice(0, +limit)       
      }

      let count = data.logs.length
      let obj = {
        _id: _id,
        username: username,
        count: count,
        log: logs     
      }
    res.json(obj)
  }}).populate('logs', {
    description: 1,
    duration: 1,
    date: 1,
    _id: 0
  })
})
    
 





const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
