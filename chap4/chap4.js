const _ = require("fxjs/Strict");
const L = require("fxjs/Lazy");
const C = require("fxjs/Concurrency");

// ## 객체를 이터러블 프로그래밍으로 다루기
//객체는 키,벨류 값 
//장점은 평가가 되지 않고 지연된 상태, 동시성을 함께 사용하는게 가능하다
//배열로 만들어서 사용하는것(지연성은 없다) 보단 이터러블로 만들어서 지연적,동시성을 갖는 
//이터러블이 사용하기 범용적이다

const obj1 = {
  a: 1,
  b: 2,
  c: 3,
  d: 4
};


//1. values
console.log(Object.values(obj1)); //[ 1, 2, 3, 4 ]
//위처럼 Object.values(객체)  를 통해 객체의 값들을 배열 형태로 얻을 수 있다 
//하지만 아래처럼 제너레이터 를 통해 객체들의 값들을 이터러블 형태로 얻는다면 객체값이 많을때 지연적으로 원하는 
//부분만 평가할 수 있기 때문에 성능상 훨씬 유리하다
L.values = function *(obj){
  for(const k in obj){
    yield obj[k];
  }
};

_.go(
  obj1,
  L.values,
  L.map(a => a + 10),
  L.take(2),
  _.reduce((a,b) => a+b),
  console.log
); //23



// 2. entries
//Object.entries(객체)  를 통해 [키, 벨류]  를 얻을 수 있지만 
//아래처럼 제너레이터를 통해 이터러블 객체를 만들면 지연성과 동시성을 얻을 수 있다

L.entries = function *(obj){
  for(const k in obj){
    yield [k, obj[k]];
  }
};
_.go(
  obj1,
  L.entries,
  L.filter(([_, v]) => v % 2),
  L.map(([k,v]) => ({[k]:v})),
  _.reduce(Object.assign),
  console.log
);  //{ a: 1, c: 3 }




//3. keys
//Object.keys(객체)  를 통해 배열형태의 값을 얻을 수 있지만 
//아래처럼 제너레이터 를 통해 이터러블 형태의 값을 얻을 수 있다
L.keys = function *(obj){
  for(const k in obj){
    yield k;
  }
};
let j = '';
_.go(
  obj1,
  L.keys,
  //_.each(console.log) //아래 두줄 대신 이걸 쓰면 key들이 출력됨
  _.each(a => (j += a)),
  console.log
);  //[ 'a', 'b', 'c', 'd' ]




//4. 어떠한 값이든 이터러블 프로그래밍으로 다루기
//  - 이터러블로 이터러블 프로그래밍
//  - 객체를 제너레이터를 이용해서 이터레이터로 만들어서 이터러블 프로그래밍
//  - 어떤 제너레이터든 이터레이터로 만들어서 이터러블 프로그래밍

const g1 = function *(stop){
  let i = -1;
  while(++i < stop){
    yield 10;
    if(false) yield 20 + 30;
    yield 30;
  }
};
console.log([...L.take(3, g1(10))]);  //[ 10, 30, 10 ]

_.go(
  g1(10),
  L.take(2),
  _.reduce((a,b) => a + b),
  console.log
);  //40




//5. object
// 배열 -> 객체로 만들어보자

//a -> b 로 만들어보자
const a = [['a', 1], ['b', 2], ['c', 3]];
const b = {a: 1, b: 2, c: 3};

// //아래의 코드는 log(object(a));   를 하면 b 의 형태가 된다
// const object = entries => _.go(
//   entries,
//   L.map(([k,v]) => ({[k]:v})),
//   _.reduce(Object.assign)
// );
//위의 코드를 reduce() 를 사용해 1개로 줄여보면 아래와 같다
const object = entries => 
  _.reduce((obj, [k,v]) => (obj[k] = v, obj), {}, entries);
//**reduce() 의 보조함수는 누적시킬 값, obj
//**                      입력받은 이터러블 객체의 순환되는 값, [k, v]
//**누적값(리턴될 값) 과 입력받은 이터러블 객체의 순환시킬 값을 조합해서 함수를 만드는 것이다!!
console.log(object(a)); //{ a: 1, b: 2, c: 3 }
console.log(object(L.entries({b: 2, c: 3}))); //{ b: 2, c: 3 }

// //위의 코드는 아래의 코드를 줄인 것이다
// //1) {} 를 만들것이고, 엔트리스를 받는다 
// const object  = entries => _reduce(함수, {}, entries);
// //2) reduce() 의 함수를 만들어보자 
// //리턴받을 값인 obj 를 적어주고, entries 에서 [키, 벨류] 형태로 값을 받기 떄문에 구조분해로 값을 받는다
// //결과에서 리턴은 obj를 한다
// const object  = entries => _reduce((obj, [k, v])=> {
//   obj[k] = v;
//   return obj;
// }, {}, entries);
// //3) 위의 코드를 줄여보자
// const object  = entries => _reduce((obj, [k, v])=> {
//   return (obj[k] = v, obj);
// }, {}, entries);
// //4) 좀더 줄여보자  {return} 를 제거
// const object  = entries => _reduce((obj, [k, v])=> (obj[k] = v, obj), {}, entries);
// //이렇게 위와 같은 코드가 완성되었다!! 


let m = new Map();
m.set('a', 10);
m.set('b', 20);
m.set('c', 30);
console.log(m); //Map { 'a' => 10, 'b' => 20, 'c' => 30 }
//위의 형태는 기존의 {a:1, b:2}  를  JSON.stringify({a:1, b:2}) 로   "{'a':1,'b':2}"  로 문자열로 바꾸는것과 
//달리 JSON.stringify(m) 을 하면  '{}'  가 된다 
console.log(JSON.stringify(m)); //{}
//하지만 위에서 만든 object() 를 사용하면 제대로 나온다
console.log(object(m)); //{ a: 10, b: 20, c: 30 }

console.log(...m[Symbol.iterator]()); //[ 'a', 10 ] [ 'b', 20 ] [ 'c', 30 ]
//위와 같이 Map() 은 이터러블을 사용하기 때문에 바뀌는게 가능하다
//map() 의 경우 values() 나 keys() 도 적용된다
console.log([...m.values()]); //[ 10, 20, 30 ]
console.log([...m.keys()]); //[ 'a', 'b', 'c' ]

//**결국 위에서 만든 object() 는 이터러블 표준만 맞춰준다면 어떤 것이든 다 바꿔줄 수 있는 다형성을 가졌다
//**(JSON.stringigy() 는 위에서 확인했듯이 키,벨류 형태의 객체만 바꿔준다) 



//6. mapObject

const mapObject = (f, obj) => _.go( //보조함수와 객체를 받는다 
  obj,        //객체를 놓고
  L.entries,  //객체에 entries로 [키,벨류] 형태로 만들어준다
  _.map(([k,v]) => ([k, f(v)])),  //보조함수를 벨류에 적용시킨다
  object      //다시 1개의 객체로 합쳐준다
);
console.log(mapObject(a => a + 10, { a: 1, b: 2, c: 3 }));  //{ a: 11, b: 12, c: 13 }
// [['a', 1], ['b', 2], ['c', 3]]  //우선 입력객체를{ a: 1, b: 2, c: 3 } entries를 통해 이터러블로 바꿔보자 
// [['a', 11], ['b', 12], ['c', 13]]  //보조함수를 a => a + 10 통해 내부 값을 더해보자 
// { a: 11 } ...
// { a: 11, b: 12, c: 13 }




//7. pick
//객체에서 키 값을 pick에 넣어서 {키:값} 객체를 출력해보자

const obj2 = { a: 1, b: 2, c: 3, d: 4, e: 5 };

const pick  = (ks, obj) => _.go(
  ks,
  L.map(k => [k, obj[k]]),
  L.reject(([k,v]) => v === undefined),
  object
);
console.log(pick(['b', 'c', 'z'], obj2)); //{ b: 2, c: 3 }
//위의 pick은 아래와 같이 사용할 수 도 있다
const pick1 = (ks,obj) => object(_.filter(([_,v]) => v !== undefined ,_.map(k => [k, obj[k]],ks)));
console.log(pick1(['b', 'c', 'z'], obj2)); //{ b: 2, c: 3 }




// 8. indexBy
//일반 배열은 키값이 배열의 인덱스 번호지만 
//indexBy 는 키값이 배열의 값이다  (배열 인덱스로 도는게 아니라 좀더 빨리 찾을 수 있다)

//**reduce 로 만들었는데... 이터러블의 값을 통해 내부를 순회하며 새로운 값을 만들어내는 것은 reduce를 사용한다! 
const users = [
  { id: 5, name: 'AA', age: 35 },
  { id: 10, name: 'BB', age: 26 },
  { id: 19, name: 'CC', age: 28 },
  { id: 23, name: 'CC', age: 34 },
  { id: 24, name: 'EE', age: 23 }
];

_.indexBy = (f,iter) => 
  _.reduce((obj, a) => (obj[f(a)] = a,obj), {}, iter);
//리턴값(누적할 값) obj를 놓고,
//obj의 키값을 f() 함수에 순회하는 이터러블의 인자를(a) 넣고 그 이터러블 인자(a)를 value 값으로 넣는다
//(이터러블 인자 a 는 { id: 5, name: 'AA', age: 35 } 이다)
//(누적할 값)obj 를 리턴하여 {} 빈객체에 계속 추가해준다 

const users2 = _.indexBy(u => u.id, users);
console.log(users2);
// { '5': { id: 5, name: 'AA', age: 35 },
//   '10': { id: 10, name: 'BB', age: 26 },
//   '19': { id: 19, name: 'CC', age: 28 },
//   '23': { id: 23, name: 'CC', age: 34 },
//   '24': { id: 24, name: 'EE', age: 23 } }




//9. indexBy 된 값을 filter 하기
console.log(_.filter(({age}) => age >= 30, users));
// [ { id: 5, name: 'AA', age: 35 },
//   { id: 23, name: 'CC', age: 34 } ]
console.log(_.filter(({age}) => age >=30,users2));
// []
//indexBy 를 거친 객체는 키값이 age가 아니라 위에서 id 값으로 키를 잡았으므로 
// 일반적인 filter() 를 적용하면 값이 안나온다

//아래와 같이 filter를 적용시켜보자
const users3 = _.go(
  users2,
  L.entries,
  L.filter(([_, {age}]) => age < 30),
  L.take(2),
  object
);
console.log(users3);
// { '10': { id: 10, name: 'BB', age: 26 },
//   '19': { id: 19, name: 'CC', age: 28 } }
console.log(users3[19]);
// { id: 19, name: 'CC', age: 28 }

//** 전체적으로 객체를 entries() 를 통해서 [키,벨류] 로 만들고 이터러블을 통해 원하는 값을 뽑거나 바꿔서 
//   만든 값들을 다시 객체로 만든 것들을 배운것이다!!