"use strict";
var fixture = require("can-fixture");
var Component = require("can-component");
var DefineMap = require("can-define/map/map");
var DefineList = require("can-define/list/list");
var superMap = require("can-connect/can/super-map/super-map");
var stache = require("can-stache");

var appStache = require("./app.stache");
var listStache = require("./list.stache");
var createStache = require("./create.stache");

require("./base.css");

// Algebra used to define the service we connect to.
// Used by fixture and by connection.
var todoAlgebra = new set.Algebra(
	set.comparators.id("id")
);

// Create fake data and service.
var todosStore = fixture.store([{
	id: 0,
	name: "take out trash",
	completed: false
}, {
	id: 1,
	name: "mow lawn",
	completed: false
}, {
	id: 2,
	name: "pick up laundry",
	completed: true
}], todoAlgebra);

fixture("/services/todos/{id}", todosStore);


// Define model types
var Todo = DefineMap.extend({
	id: "number",
	name: "string",
	completed: "boolean",
	editing: "boolean"
});


Todo.List = DefineList.extend({

	"*": Todo,
	remaining: {
		get: function() {
			return this.filter({
				completed: false
			});
		}
	},
	completed: {
		get: function() {
			return this.filter({
				completed: true
			});
		}
	},
	destroyCompleted: function() {
		this.completed.forEach(function(todo) {
			todo.destroy()
		});
	},
	setCompletedTo: function(value) {
		this.forEach(function(todo) {
			todo.completed = value;
		});
	}
});

// Wire types up to URL
superMap({
	url: "/services/todos",
	Map: Todo,
	List: Todo.List,
	algebra: todoAlgebra,
	name: "todos"
});

var TodosCreateVM = DefineMap.extend({
	name: "string",
	createTodo: function() {
		new Todo({
			name: this.name,
			completed: false
		}).save();
		this.name = "";
	}
});

// Creates todos
Component.extend({
	tag: "todos-create",
	template: createStache,
	ViewModel: TodosCreateVM
});

var TodosListVM = DefineMap.extend({
	todos: Todo.List,
	edit: function(todo) {
		todo.editing = true;
	},
	updateTodo: function(todo, newName) {
		todo.name = newName;
		todo.editing = false;
		todo.save();
	}
});
// Lists todos and
Component.extend({
	tag: "todos-list",
	template: listStache,
	ViewModel: TodosListVM
});

// Create the application view model
var AppViewModel = DefineMap.extend({
	todosPromise: {
		value: Todo.getList.bind(Todo, {})
	},
	todos: {
		get: function(setVal, resolve) {
			this.todosPromise.then(resolve, function(e){
				setTimeout(function(){
					throw e;
				},1)
			})
		}
	},
	displayedTodos: {
		get: function() {
			var filter = this.filter;
			var todos = this.todos;
			if (todos) {
				if (filter == "active") {
					return todos.remaining;
				} else if (filter == "completed") {
					return todos.completed;
				} else {
					return todos;
				}
			}
		}
	}

});

var appViewModel = new AppViewModel();

// connect it to the route
/*route.map(appViewModel)
route.ready();*/

stache.registerHelper("plural", function(word, num) {
	var val = num();
	return val == 1 ? word : word + "s";
});

// render the template with the app view model
$(document.body).append(appStache(appViewModel));
