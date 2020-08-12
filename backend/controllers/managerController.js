// ** MANAGER ROUTES **
const bcrypt = require("bcryptjs");

Manager = require("../models/managerModel");

// Get Manager's Data
exports.view = (req, res, next) => {
  const manager = req.user;
  res.json({
    message: "Manager details retrieved successfully!",
    data: {
      _id: manager._id,
      firstName: manager.firstName,
      email: manager.email,
      users: manager.users,
    },
  });
};

// Create New Manager
exports.new = (req, res, next) => {
  const { email, password, firstName } = req.body;
  Manager.findOne({ email: email }, function (err, manager) {
    if (err) {
      return next(err);
    } else if (manager) {
      res.render("login.ejs", {
        email: email.toString(),
        messages: { error: "An account with that email already exists!" },
      });
    } else {
      let manager = new Manager();
      manager.email = email;
      manager.password = password;
      manager.firstName = firstName;

      bcrypt.genSalt(10, function (err, salt) {
        if (err) return next(err);
        bcrypt.hash(manager.password, salt, function (err, hash) {
          if (err) return next(err);
          manager.password = hash;
          manager.save((err) => {
            if (err) return next(err);
            res.redirect("/login");
          });
        });
      });
    }
  });
};

// Update Manager's Data
exports.update = (req, res, next) => {
  const { manager } = req.targets;
  const { firstName, email, password, confirmPassword } = req.body;

  Manager.findOne({ email: email }, function (err, managerInDB) {
    if (err) return next(err);
    if (managerInDB && manager.email !== email) {
      res.render("login.ejs", {
        email: email.toString(),
        messages: { error: "An account with that email already exists!" },
      });
    } else {
      manager.firstName = firstName ? firstName : manager.firstName;
      manager.email = email ? email : manager.email;
      manager.save((err) => {
        if (err) return next(err);
        res.redirect("/login");
        //       res
        //         .status(200)
        //         .json({ message: "Manager Info Updated", data: manager });
      });

      // manager.password = password ? password : manager.password;
      // bcrypt.genSalt(10, function (err, salt) {
      //   if (err) return next(err);
      //   bcrypt.hash(manager.password, salt, function (err, hash) {
      //     if (err) return next(err);
      //     manager.password = hash;
      //     manager.save((err) => {
      //       if (err) return next(err);

      //     });
      //   });
      // });
      // manager.password = password ? password : manager.password; TODO: Add password checker
    }
  });
};

// Delete Manager
exports.delete = (req, res, next) => {
  const { manager } = req.targets;
  Manager.deleteMany(
    {
      _id: manager._id,
    },
    function (err) {
      if (err) return next(err);
      res.json({
        status: "success",
        message: "Manager deleted",
      });
    }
  );
};
