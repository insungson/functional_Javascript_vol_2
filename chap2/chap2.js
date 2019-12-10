const _ = require("fxjs/Strict");
const L = require("fxjs/Lazy");
const C = require("fxjs/Concurrency");



//## 명령형 습관 지우기 - 만능 reduce? No!

//1. reduce + 복잡한 함수 + acc 보다  map + 간단한 함수 + reduce
//reduc(함수, 초기값, 이터러블)   ->    reduce(함수, map(이터러블))  
//위와 같이 map()을 통해 함수에 들어가는 데이터를 일치시켜 초기값을 없애면 좀더 복잡함이 줄어든다

const users = [
  { name: 'AA', age: 35 },
  { name: 'BB', age: 26 },
  { name: 'CC', age: 28 },
  { name: 'CC', age: 34 },
  { name: 'EE', age: 23 }
];
console.log(_.reduce((total, u) => total + u.age, 0, users)); //146
//reduce()가 복잡하다 생각되는 이유는.. 
//이터러블 객체의 형태에 맞춰서 (total, u) => total + u.age 라는 보조함수를 만들고, 
//시작값 을 통해서 합산을 하기 때문이다 

const add = (a,b) => a + b;

console.log(_.reduce(add, L.map(u => u.age, users))); //146
//그래서 위의 함수처럼 reduce에 넣기전에 map() 을 사용하여 미리 숫자로 뽑는다면, 숫자형태가 reduce()에 들어가 
//시작값을 뺄 수 있고, 복잡함이 좀 줄어든다

const ages = L.map(u => u.age);
//위와 같이 아예 ages() 함수를 만들어 map()을 빼버리면 아래처럼 좀더 간단해 진다
console.log(_.reduce(add, ages(users))); //146



//2. reduce 하나 보다 map + filter + reduce
// reduce 안의 보조함수가 복잡하지 않게 바꾸는것이 목적이다

console.log(
  _.reduce((total, u) => u.age >= 30 ? total : total + u.age, 
  0, 
  users
)); //77
//위와 같이 reduce(함수, 초기값, 이터러블 객체)   에서 함수를 복잡하게 만드는것 보단
//아래와 같이 map, filter를 이용해서 reduce(함수(간단한), map.filter(이터러블객체))  
//처럼 함수에 같은 데이터가 들어가도록 간단하게 바꾸는 편이 좋다
console.log(
  _.reduce(add,L.map(u => u.age, L.filter(u => u.age < 30, users)))
);  //77

console.log(
  _.reduce(add, L.filter(u => u < 30, L.map(u => u.age, users)))
);  //77



//3. query

const obj1 = {
  a: 1,
  b: undefined,
  c: 'CC',
  d: 'DD'
};
//위의 함수를 아래처럼 만들어보자!
// a=1&c=CC&d=DD

//우선 명령형으로 위의 것을 바꿔보자
function query1(obj){
  let res = '';
  for(const k in obj){
    const v = obj[k];
    if(v == undefined) continue;
    if(res != '') res += '&';
    res += k + '=' + v;
  }
  return res;
}
console.log(query1(obj1)); //a=1&c=CC&d=DD

//위의 명령형을 함수형으로 바꿔보자
function query2(obj){
  return Object
    .entries(obj)
    .reduce((query, [k,v], i) => {                   //query : 누적값, [k,v] : entries를 거친 키,값,   
      if(v === undefined) return query;             //i: 현재 요소가 속한 Array객체
      return  `${query}${i > 0 ? '$' : ''}${k}=${v}`;  //i는 object에 남은 요소
    }, '');//query 는 결과값, [k,v] 는 key value 값  entries로 k,v 가 나뉨 
}
console.log(query2(obj1)); //a=1&c=CC&d=DD


//위에서 만든 함수형을 좀더 심플하게 바꿔보자
const join = _.curry((sep, iter) => _.reduce((a,b) => `${a}${sep}${b}`, iter));

const query3 = obj => 
  join('&', 
    _.map(([k, v]) => `${k}=${v}`, 
      _.reject(([_, v]) => v === undefined, Object.entries(obj))));
console.log(query3(obj1));  //a=1&c=CC&d=DD


// //query3 이 만들어지는 순서
// //1) [key, value] 값으로 뽑는다
// function query3(obj){
//   return Object.entries(obj);   //[key, value]  로 출력됨
// }
// //2) filter로 [key, value] 를 구조분해 해준다
// return _.filter(([k, v]) => console,log(k, v),Object.entries(obj));  // key, value  로 출력됨(구조분해됨)
// //3) filter로 undefined 되는 value는 없애준다
// return _.filter(([k, v]) =>  v !== undefined ,Object.entries(obj));  //value가 undefined 인 키&value는 출력안됨
// //4) filter -> _reject 로 바꿔준다
// return _.reject(([k, v]) =>  v === undefined ,Object.entries(obj)); 
// //5) 함수형 프로그래밍에선 안쓰는 변수는 보통 _ 로 처리한다
// return _.reject(([_, v]) =>  v === undefined ,Object.entries(obj)); 
// //6) reduce를 적용시키기 전에 map 으로 출력되는 모양을 바꿔보자 
// return _.map(([k,v]) => `${k}=${v}`) , _.reject(([k, v]) =>  v === undefined ,Object.entries(obj)); 
// //                                                filter(reject) 함수           이터러블[key,value]
// //              map 함수                 filter로 걸러진 이터러블
// // 결과는 [key=value,key=value,...]  이런식으로 나온다
// //7) 이제 위의 이터러블을 reduce()에 집어넣으면 된다
// return _.reduce((a,b) => `${a}&${b}`, _.map(([k,v]) => `${k}=${v}`) , _.reject(([k, v]) =>  v === undefined ,Object.entries(obj)));
// //                           reduce()의 보조함수                          map,filter 로 만들어진 이터러블
// //key=value&key=value&key=value...  이제 이런식으로 출력된다
// //8) reduce() 부분을 처리하는 join 이라는 함수를 만들어보자 (sep, iter 인자를 받는걸 생각하고 만들자) 이후 curry처리
// const join = _.curry((sep, iter) => _.reduce((a,b) => `${a}${sep}${b}`, iter));
// //9) 위에서 만든 join을 붙여보자
// return join('&', _.map(([k,v]) => `${k}=${v}`) , _.reject(([k, v]) =>  v === undefined ,Object.entries(obj))); 
// // join함수 sep,  map,filter 를 거친 이터러블
// //10) 위에서 완성된 함수를 좀 더 다르게 바꿔보자
// const query4 = obj => _.go(   //obj 객체를 받아서
//   obj,                        //적용시키고
//   Object.entries,             //[key, value]  값으로 나누고
//   _.reject((_,v) => v === undefined), //filter 로 value가 undefined 는 제외하고
//   _.map(([k, v]) => `${k}=${v}`), //map 으로  key=value 형태로 만들고
//   join('&')                   //위에서 만든 join()으로 합쳐준다 
// );
// //11) obj는 받는 인자이기 떄문에 없애주고 go() 대신 pipe()로 받아서 아래와 같이 처리하는것도 가능하다(query4)

// /*const query4 = _.pipe(
//   Object.entries,
//   L.reject(([_, v]) => v === undefined),
//   L.map(([k, v]) => `${k}=${v}`),   //[k, v]) => `${k}=${v}` 이부분은 join('=') 로 변경이 가능하다
//   _.reduce((a, b) => `${a}&${b}`));*/

// //12) query4 에 reduce()  ->   join() 을 사용하면 아래같이 표현이 된다


const query5 = _.pipe(
  Object.entries,
  L.reject(([_, v]) => v === undefined),
  L.map(join('=')),
  join('&')
);
console.log(query5(obj1)); //a=1&c=CC&d=DD





//4. queryToObject
//앞에서 만든 query 문자 -> Object 형태로 만들어보자

// //1) 우선 split()으로 문자를 나눠보자 
// //  문자를 받고 구분할 문자를 받아 자바스크립트 split 함수를 이용하여 아래와 같이 나눈다
// const split = (sep, str) => str.split(sep);
// //2) cuury를 붙여서 계속 잇게 만들자
// const split = curry((sep, str) => str.split(sep));

const split = _.curry((sep, str) => str.split(sep));

const queryToObject = _.pipe(
  split('&'),       //[ 'a=1', 'c=CC', 'd=DD' ]
  L.map(split('=')),  //['a','1'],['c','CC'],['d','DD']
  L.map(([k,v]) => ({[k]:v})),  //{a:'1'},{c:'CC'},{d:'DD'}
  _.reduce(Object.assign)   //{a:'1',c:'CC',d:'DD'}   Object.assign 은 객체를 1개로 합쳐주는 일을 한다
);     // Object.assign({a:1},{b:2})  => {a:1, b:2}  와 같은 결과가 나온다
console.log(queryToObject('a=1&c=CC&d=DD'));  //{ a: '1', c: 'CC', d: 'DD' }