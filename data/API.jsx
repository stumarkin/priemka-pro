import axios from 'axios';

const baseURL = 'https://priemka-pro.ru/api/v2/';

export const Get = ( params ) => { 
    return new Promise((resolve, reject) => {
    axios({
        method: 'get',
        baseURL,
        params: ( typeof params == 'string' ? {method: params} : params)
    })
    .then( res => {
        resolve(res)
    })
    .catch(err => {
        reject(err)
    })
})}

export const Post = ( params, data ) => { 
    return new Promise((resolve, reject) => {
    axios({
        method: 'post',
        baseURL,
        params: ( typeof params == 'string' ? {method: params} : params),
        data,
        headers: { 'Content-Type': 'multipart/form-data' }
    })
    .then( res => {
        resolve(res)
    })
    .catch(err => {
        reject(err)
    })
})}

 
// export const getBanners = ( ) =>  {
//     const apiMethod = 'getbanners';
//     return new Promise((resolve, reject) => {
//         get(apiMethod)
//         .then( res => { resolve(res) })
//         .catch(err => { reject(err) })
//     })
// } 
