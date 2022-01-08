# Mapty Project

Mapty is a simple app that helps you log your running and cycling workouts based on their location. Simply click on the map where you workout started, fill out the form with the type of workout, duration, distance, eleveation or cadence (based on the type of workout) and that's it. From there, your workout is rendered in the sidebar list and a marker on the map is rendered.

_This little app was created during my first JavaScript course._

## 🚀 So how does is work?

I created this app when learning the fundamentals of Object-Oriented Programming. It is 100% Vanilla JavaScript and uses 4 different classes, 2 unique classes (App and Workout) and 2 child classes (Running and Cycling which extend Workout):

1. **The `App` class**: this is the main class that makes the entire app work. It creates and executes all the different methods needed. Some notable methods are:

  - `.getPosition()` and `.loadMap(position)`: get the geographic coordinates of the user, and render a map of that location using the Leaflet library.

  - `.toggleElevationField()`: allows to choose the type of workout (running or cycling).

  - `.showForm()`: displays the input form in the sidebar to create a new workout.

  - `.newWorktout()`: this is the main method in this app, it creates a new workout after the form has been submitted. It first creates a new Running or Cycling object depending on the form and then calls a list of methods. These methods push the workout to a workouts array, display the workout in the sidebar and on the map, hide the form, add the workouts to locale storage and update the totals at the bottom of the sidebar.

  - `.calculateTotals()`: every time a new workout is created, the bottom of the sidebar displays the totals for each type of workout. This method was a good way to implement the reduce() method.

  - `.renderTotalsHighlight()`: this method is a method I like to implement on most projects I do. It relates to the pill shape that slides left and right when selecting the type of workout you'd like to see the totals of. It's a pretty simple method that relies on the getBoundingClientRect() method, but I think it makes for a more dynamic web app.

  - `.goToMarker()`: allows users to recenter the map when they click on a workout from the sidebar. This was a fun one to implement and required me to look deeper into the Leaflet docs.

  - `deleteWorkout()`: allows the user to delete a workout using the delete button in the sidebar. When deleting, the workout is removed from the workouts array, the HTML element is removed, the marker on the map is removed, the totals are recalculated and the new workouts array is added to local storage.

  - `.openModal()` and `.closeModal()`: handle the opening and closing of the window you're reading right now.

2. **The `Workout` class**: this class creates the properties that are shared by both child classes (Running and Cycling) such as the date, id, distance, duration and geographic coordinates.

3. **The `Running` class** (child class of Workout): this class creates the properties that are specific to the running type of activity such as the cadence, the pace and the name.

4. **The `Cycling` class** (child class of Workout): this class creates the properties that are specific to the cycling type of activity such as the elevation gain, the speed and the name.

## 🎓 What did I learn with this project?

This project was my first time practicing my Object Oriented Programming skills. I was a a great way to see how to quickly create objects and manipulate them. Even though this example is fairly simple, I think it really helped me visualize how OOP can be useful in many cases. It also gives me a better understanding of how some of the apps I use on a daily basis execute in the background.

## ⏭ What's next now?

I actually already put some of those learnings in a new project that I came up with. I'm a big Twitter fan for information and learning so I created a little [Twitter thread builder](https://twitterthreadbuilder-pierregoaer.netlify.app/) using OPP.
