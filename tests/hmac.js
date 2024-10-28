const product = {
    a: 1,
    b: 2,
    c: {
        d: 3,
        e: 4
    }
}

db.collection.updateOne({
  a: 1,
  b: 2,
  c: {
    d: 3,
    e: 4,
  },
});