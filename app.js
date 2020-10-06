//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect("mongodb+srv://admin-aaron:jLbJoBvkrbSo3Rz9@cluster0.suosp.mongodb.net/todolistDB", {
  useNewUrlParser: true, 
  useUnifiedTopology: true, 
  useFindAndModify: false
});

const itemsSchema = ({
  name: {
    type: String,
    required : [true, "No name specified."]
  }
});

const Item = mongoose.model("Item", itemsSchema);

const codeLesson = new Item({
  name: "Coding Lesson"
});

const guitar = new Item({
  name: "Play guitar"
});

const hololive = new Item({
  name: "Watch Hololive"
});

const defaultItems = [codeLesson, guitar, hololive];

const listSchema = {
  name: String,
  items: [itemsSchema]
};

const List = mongoose.model("List", listSchema);

app.get("/", function(req, res) {

  Item.find({}, function(err, foundItems) {

    if (foundItems.length === 0) {
      Item.insertMany(defaultItems, function(err) {
        if (err) {
          console.log(err);
        } else {
          console.log("Added to To-do List DB");
        }
      });
      res.redirect("/");
    } else {
      res.render("list", {listTitle: "Today", newListItems: foundItems});
    }
  });
});

app.get("/:customListName", function (req, res) {
  const customListName = _.capitalize(req.params.customListName);
  
  List.findOne({name: customListName}, function (err, foundList) {
    if (!err) {
      if (!foundList){
        const list = new List({
          name: customListName,
          items: defaultItems
        });
      
        list.save();
        res.redirect("/" + customListName);
      } else {
        // Show existing list
        res.render("list", {listTitle: foundList.name, newListItems: foundList.items})
      }
    }
  });



});

app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName
  });

  if (listName === "Today") {
    item.save()
    res.redirect("/");
  } else {
    List.findOne({name: listName}, function (err, foundList) {
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);
    })
  };
});

app.post("/delete", function (req, res) {
  const checkedItemID = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today") {
    Item.findByIdAndRemove(checkedItemID, function(err) {
      if (!err) {
        console.log("Successfully deleted");
        res.redirect("/");
      };
    });
  } else {
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemID}}}, function (err, foundList) {
      if (!err) {
        res.redirect("/" + listName)
      }
    });
  }
});

app.get("/about", function(req, res){
  res.render("about");
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
