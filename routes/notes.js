'use strict';

const express = require('express');

// const router = express.Router();

const mongoose = require('mongoose');

const Note = require('../models/note');

const Folder = require('../models/folder');

const Tag = require('../models/tag');

function validateFolderId(userId, folderId) {
  if (!folderId) {
    return Promise.resolve();
  }
  return Folder.findOne({ _id: folderId, userId })
    .then(result => {
      if (!result) {
        return Promise.reject('InvalidFolder');
      }
    });
}

function validateTagIds(userId, tags = []) {
  if (!tags.length) {
    return Promise.resolve();
  }
  return Tag.find({ $and: [{ _id: { $in: tags }, userId }] })
    .then(results => {
      if (tags.length !== results.length) {
        return Promise.reject('InvalidTag');
      }
    });
}

const router = express.Router();

/* ========== GET/READ ALL ITEMS ========== */
router.get('/notes', (req, res, next) => {
  const { searchTerm, folderId, tagId } = req.query;
  const userId = req.user.id;

  let filter = { userId };

  /**
   * BONUS CHALLENGE - Search both title and content using $OR Operator
   *   filter.$or = [{ 'title': { $regex: re } }, { 'content': { $regex: re } }];
  */

  if (searchTerm) {
    const re = new RegExp(searchTerm, 'i');
    filter.title = { $regex: re };
  }

  if (folderId) {
    filter.folderId = folderId;
  }

  if (tagId) {
    filter.tags = tagId;
  }

  Note.find(filter)
    .populate('tags')
    .sort('created')
    .then(results => {
      res.json(results);
    })
    .catch(err => {
      next(err);
    });
});

/* ========== GET/READ A SINGLE ITEM ========== */
router.get('/notes/:id', (req, res, next) => {
  const { id } = req.params;
  const userId = req.user.id;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    const err = new Error('The `id` is not valid');
    err.status = 400;
    return next(err);
  }

  Note.findOne({ _id: id, userId })
    .populate('tags')
    .then(result => {
      if (result) {
        res.json(result);
      } else {
        next();
      }
    })
    .catch(err => {
      next(err);
    });
});

// /* ========== POST/CREATE AN ITEM ========== */
// router.post('/notes', (req, res, next) => {
//   const { title, content, folderId, tags } = req.body;
//   const userId = req.user.id;
//   const newItem = { title, content, folderId, tags, userId };
//   /***** Never trust users - validate input *****/


//   if (!title) {
//     const err = new Error('Missing `title` in request body');
//     err.status = 400;
//     return next(err);
//   }
  


//   if (tags) {
//     tags.forEach((tag) => {
//       if (!mongoose.Types.ObjectId.isValid(tag)) {
//         const err = new Error('The `id` is not valid');
//         err.status = 400;
//         return next(err);
//       }
//     });
//   }

  

//   Note.create(newItem)
//     .then(result => {
//       res.location(`${req.originalUrl}/${result.id}`).status(201).json(result);
//     })
//     .catch(err => {
//       next(err);
//     });
// });

// /* ========== PUT/UPDATE A SINGLE ITEM ========== */
// router.put('/notes/:id', (req, res, next) => {
//   const { id } = req.params;
//   const { title, content, folderId, tags } = req.body;
//   const userId = req.user.id;//new
//   const updateItem = { title, content, tags, userId };//why folderId not included
  
//   /***** Never trust users - validate input *****/
//   if (!title) {
//     const err = new Error('Missing `title` in request body');
//     err.status = 400;
//     return next(err);
//   }

//   if (!mongoose.Types.ObjectId.isValid(id)) {
//     const err = new Error('The `id` is not valid');
//     err.status = 400;
//     return next(err);
//   }

//   if (mongoose.Types.ObjectId.isValid(folderId)) {
//     updateItem.folderId = folderId;
//   }

//   if (tags) {
//     tags.forEach((tag) => {
//       if (!mongoose.Types.ObjectId.isValid(tag)) {
//         const err = new Error('The `id` is not valid');
//         err.status = 400;
//         return next(err);
//       }
//     });
//   }

//   // if (mongoose.Types.ObjectId.isValid(userId)) {//new
//   //   updateItem.userId = userId;
//   // }


//   // const updateItem = { title, content, tags };
//   //const updateItem = { title, content, folderId, tags, userId };//new
  
//   const options = { new: true };

//   Note.findByIdAndUpdate(id, updateItem, options)
//     .populate('tags')
//     .then(result => {
//       if (result) {
//         res.json(result);
//       } else {
//         next();
//       }
//     })
//     .catch(err => {
//       next(err);
//     });
// });

/* ========== POST/CREATE AN ITEM ========== */
router.post('/notes', (req, res, next) => {
  const { title, content, folderId, tags } = req.body;
  const userId = req.user.id;
  const newNote = { title, content, tags, userId };

  /***** Never trust users - validate input *****/
  if (!title) {
    const err = new Error('Missing `title` in request body');
    err.status = 400;
    return next(err);
  }

  if (mongoose.Types.ObjectId.isValid(folderId)) {
    newNote.folderId = folderId;
  }

  const valFolderIdProm = validateFolderId(userId, folderId);
  const valTagIdsProm = validateTagIds(userId, tags);

  Promise.all([valFolderIdProm, valTagIdsProm])
    .then(() => Note.create(newNote))
    .then(result => {
      res.location(`${req.originalUrl}/${result.id}`).status(201).json(result);
    })
    .catch(err => {
      if (err === 'InvalidFolder') {
        err = new Error('The folder is not valid');
        err.status = 400;
      }
      if (err === 'InvalidTag') {
        err = new Error('The tag is not valid');
        err.status = 400;
      }
      next(err);
    });
});

/* ========== PUT/UPDATE A SINGLE ITEM ========== */
router.put('/notes/:id', (req, res, next) => {
  const { id } = req.params;
  const { title, content, folderId, tags } = req.body;
  const userId = req.user.id;
  const updateNote = { title, content, tags, userId };

  /***** Never trust users - validate input *****/
  if (!title) {
    const err = new Error('Missing `title` in request body');
    err.status = 400;
    return next(err);
  }

  if (!mongoose.Types.ObjectId.isValid(id)) {
    const err = new Error('The `id` is not valid');
    err.status = 400;
    return next(err);
  }

  if (mongoose.Types.ObjectId.isValid(folderId)) {
    updateNote.folderId = folderId;
  }

  const valFolderIdProm = validateFolderId(userId, folderId);
  const valTagIdsProm = validateTagIds(userId, tags);

  Promise.all([valFolderIdProm, valTagIdsProm])
    .then(() => {
      return Note.findByIdAndUpdate(id, updateNote, { new: true }).populate('tags');
    })
    .then(result => {
      if (result) {
        res.json(result);
      } else {
        next();
      }
    })
    .catch(err => {
      if (err === 'InvalidFolder') {
        err = new Error('The folder is not valid');
        err.status = 400;
      }
      if (err === 'InvalidTag') {
        err = new Error('The tag is not valid');
        err.status = 400;
      }
      next(err);
    });
});

/* ========== DELETE/REMOVE A SINGLE ITEM ========== */
router.delete('/notes/:id', (req, res, next) => {
  const { id } = req.params;
  const userId = req.user.id;

  Note.findByIdAndRemove({ _id: id, userId })
    .then(result => {
      if(result) {
        res.status(204).end();
      } else {
        next();
      }
    })
    .catch(err => {
      next(err);
    });
});

module.exports = router;