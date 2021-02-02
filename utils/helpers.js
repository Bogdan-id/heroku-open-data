'use strict'

exports.getPerson = function(db, cn, req, res, queryObj) {
  const { lastName, firstName, patronymic} = req.body
  let setQP = [...new Set([
    {param: 'initials', qp:`${lastName} ${firstName} ${patronymic}`},
    {param: 'initials', qp:`${firstName} ${patronymic} ${lastName}`},
    {param: 'lastFirstName', qp: `${lastName} ${firstName}`},
    {param: 'lastFirstName', qp: `${firstName} ${lastName}`},
    {param: 'lastName' , qp: lastName},
    {param: 'firstName', qp: firstName},
    {param: 'patronymic', qp: patronymic}
  ])]
  .filter(obj => obj.qp)
  .map(obj => {
    console.log(obj.qp)
    console.log(queryObj(obj))
    return async function() {
      return await db.collection(cn)
        .find(queryObj(obj))
        .toArray()
        .then(v => {
          if(v.length) v.push(obj.param)
          return v
        })
    }
  })

  async function mgReq() {
    try {
      let finalRes
      for await (let result of setQP) {
        finalRes = await result()
        if(finalRes.length) {
          res.status(200).json(finalRes)
          break
        }
        else continue
      }
      if(!finalRes.length) res.status(200).json([])
    } catch(err) {console.log(err)}
  }
  mgReq()
}