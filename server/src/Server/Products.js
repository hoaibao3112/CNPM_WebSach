import db from '../config/connectDatabase.js';
import express from 'express';

const express = require('express');
const router = express.Router();

router.get('/products', (req, res) => {
  const query = 'SELECT * FROM product';
  db.query(query, (err, results) => {
    if (err) {
      console.error('error running query:', err);
      res.status(500).send({ message: 'Error fetching products' });
    } else {
      res.json(results);
    }
  });
});

module.exports = router;