const fetchBalance = require('./fetchBalance')
const gecko = require('./apis/geckoapi')
import {Request,Response,NextFunction} from 'express'
import fs from 'fs'
import path from "path";
const config = require(path.join('./','..','config.json'))
const router = require('express').Router()

export default async function (req:Request,res:Response,next:NextFunction){
    try{
        //get map of erc20 tokens from CoinGeckoApi, passing the scope of search as a pages param
        const tokenBase = await gecko()
        //if data for the address has already being logged, serve it straight from the file
        if(req.params.address === config.address && fs.existsSync(path.join('data','balance.json'))){
            const balance = await fs.promises.readFile(path.join('data','balance.json'))
            const balanceJson = JSON.parse(balance.toString())
            //check if date at which the file was created is not more than set update interval, other way - fetch from API
            const oldDate = new Date(balanceJson.createdAt)
            const dateDiff = (+Date.now() - +oldDate)/<number>config.interval
            if(dateDiff <= 1){
                balanceJson.createdAt = oldDate
                return res.status(200).json( {...balanceJson})
            }
        }
        //if not - fetch balance for an address sing the token map,
        //get ether native balance and all found tokens as result
        const result = await fetchBalance(req.params.address,tokenBase)
        result.createdAt = new Date(Date.now())
        return res.status(200).json( {...result})
    }catch(err){
        next(err)
    }
}
