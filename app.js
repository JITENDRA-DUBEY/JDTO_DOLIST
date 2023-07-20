//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const date = require(__dirname + "/date.js");
const mongoose = require('mongoose');
const app = express();
const _ = require('lodash'); 

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));
mongoose.connect('mongodb://127.0.0.1:27017/todolistDB').then(()=>{
  console.log("mongodb connected succesflly");
})
.catch((err)=>{
  console.log("error"+err);
})
// here we create schema for item
const itemSchema = new mongoose.Schema({
     name:String
})
const Item = new mongoose.model('item',itemSchema);
const item1 = new Item({
  name:"Welcome to your todolist!"
})
const item2 = new Item({
  name:"Hit the + button to add a new item."
})
const item3 = new Item({
  name:"<--Hit this to delete an item."
})
const defaultItems=[item1,item2,item3];
// create a new schema
const listSchema = new mongoose.Schema({
  name:String,
  items:[itemSchema]
})
const List = new mongoose.model('list',listSchema);

app.get("/", function(req, res) {


//  here we print all the documnet of itemcollection
Item.find().then(foundItems=>{
  // console.log(foundItems);
  if(foundItems.length===0)
  {
    //that means no data inserted in collection
    // insert all 3 items into items collection
      Item.insertMany(defaultItems).then((docs)=>{
        console.log("Succesfully save default items"+docs);
        }).catch((err)=>{
        console.log("Item not inserted succesfully"+err);
        })
        res.render("/");
  }
  else{
  res.render("list", {listTitle: "Today", newListItems: foundItems});}
}).catch((err)=>{
  console.log(err)
})
 

});

app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName= req.body.list;
  const item = new Item({
    name:itemName
  })
  // to add item into collection
  if(listName==="Today")
  {item.save();
  res.redirect("/");
}
  // add data into custom list
  else{
     // find your list and than add new item in list.items
     List.findOne({name:listName})
     .then((docs)=>{
      // to add a new item in custom list
      docs.items.push(item);
      docs.save();// to update in db
      res.redirect("/"+listName);
  })
  .catch((err)=>{
    console.log(err);
  })
}
});
// for deleting an element form todolist by checking checkbox
app.post('/delete', (req, res) => {
  const checkedItemId = req.body.status;
  const listName=req.body.listName;
  console.log(`Checkbox status: ${checkedItemId}`);
  // here we delete el from the database according to id
  if(listName==="Today"){
  Item.deleteOne({_id:checkedItemId}).then(()=>{
    alert("succesfully completed");
    console.log("successfully deleted!");
  }).catch((err)=>{
    console.log(err);
  })
  res.redirect("/");
}
// we have to delete the data from custom item
else{
  List.findOne({ name: listName })
   .then(list => {
     const indexToDelete = list.items.findIndex(obj => obj._id.toString() === checkedItemId.toString());
    console.log("idxval:"+indexToDelete);
     if (indexToDelete !== -1) {
       // Object found, delete it
       list.items.splice(indexToDelete, 1);
      //  alert("succesfully completed");
     } else {
       // Object not found, handle the error
       console.log("object is not found")
     }
    //  to save data
     list.save()
       .then(savedList => {
         // Successfully saved the updated document
         console.log('Updated list:', savedList);
         res.redirect("/"+listName);
       })
       .catch(error => {
        console.log("object is not found1")
       });
   })
   .catch(error => {
     // Handle error
     console.log("object is not found2")
   });
}
});
app.get("/about", function(req, res){
  res.render("about");
});
// for dynamic route
app.get("/:customListName", function(req,res){ 
  const customListName = _.capitalize(req.params.customListName);
  // for checking duplicate list
  List.findOne({name:customListName })
 .then((docs)=>{
  if(!docs)
  {
    if(customListName!="favicon.ico")
  {
    // do nthing
  
     const list = new List({
      name:customListName,
      items:defaultItems
    })
    list.save();
    res.redirect("/"+customListName)
  }
  }
  else{
     console.log("Result: already there so no need to insert this ");
     res.render("list", {listTitle: docs.name, newListItems: docs.items});
    }
 })
 .catch((err)=>{
     console.log(err);
 }); 
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
