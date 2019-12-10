const _ = require("fxjs/Strict");
const L = require("fxjs/Lazy");
const C = require("fxjs/Concurrency");



//## 사용자 정의 객체를 이터러블 프로그래밍으로 다루기


// 1. Map, Set
//자바스크립트 내장객체인 Map, Set 도 사용자정의 객체와 같다

let m = new Map();
m.set('a', 1);
m.set('b', 2);
m.set('c', 3);

console.log(m); //Map { 'a' => 1, 'b' => 2, 'c' => 3 }

_.go(
  m,
  _.filter(([k,v]) => v % 2),
  entries => new Map(entries),  //entries 를 통해 [키,벨류]  를 만들고 new Map([key,value])  를 하면 
  console.log                   //Map을 만들 수 있다
);  //Map { 'a' => 1, 'c' => 3 }

let s = new Set();
s.add(10);
s.add(20);
s.add(30);

console.log(s); //Set { 10, 20, 30 }

//s 에는 [10,20,30] 으로 배열이 생기기 때문에 아래와 같이 reduce를 적용시킬 수 있다
const add = (a,b) => a+b;
console.log(_.reduce(add, s));  //60




// 2. Model, Collection
//클래스는 객체 구조지만.. 역시 이터러블하게 사용할 수 있다 아래의 예들을 살펴보자
//객체지향의 클래스가 있다고 해도 내부에 구현된 메서드가 if문 for문으로 로직들이 구현되어있기 때문에 
//map, filter, reduce 를 통해서 이터러블하게 바꿀 수 있다

class Model {
  constructor(attrs = {}){
    this._attrs = attrs;
  }
  get(k){
    return this._attrs[k];
  }
  set(k,v){
    this._attrs[k] = v;
    return this;
  }
}

class Collection {
  constructor(models = []){
    this._models = models;
  }
  at(idx){
    return this._models[idx];
  }
  add(model){
    this._models.push(model);
    return this; 
  }
//이터러블을 지원하도록 만든다
//ex) map의 경우 기본 Symbol.iterator가 entries 이고 
//    set의 경우 기본 Symbol.iterator가 values 이다
  *[Symbol.iterator](){   //Symbol.iterator 앞에 제너레이터 선언을 하고 
    yield *this._models;  //여기선 models 를 뽑아주면 된다
  }
}
//[model, model...] 과 같은 model이 배열안에 들어가게 된다(이터러블 생성됨)
//아래의 코드가 위처럼 된 것이다
// *[Symbol.iterator](){
//   for(const model of this._models){
//     yield model;
//   }
// }

//아래의 코드로 해도 동작한다
// [Symbol.iterator](){
//   return this._models[Symbol.iterator]();   //아예 this._models에 이터레이터 작업을 해준다
// }


const coll = new Collection(); 
coll.add(new Model({ id: 1, name: 'AA' }));
coll.add(new Model({ id: 3, name: 'BB' }));
coll.add(new Model({ id: 5, name: 'CC' }));
//아래의 구조로 되어있다
// Collection {
//   _models:
//    [ Model { _attrs: [Object] },
//      Model { _attrs: [Object] },
//      Model { _attrs: [Object] } ] }

console.log(coll.at(2).get('name'));  //CC
console.log(coll.at(1).get('id'));  //3

//만약 제너레이터를 통한 이터레이터가 없다면 아래같이 값을 꺼낼 수 있다
_.go(
  L.range(3),
  L.map(i => coll.at(i)),
  L.map(n => n.get('name')),
  // _.each(console.log)
  _.reduce((obj, a) => (obj += a, obj)),
  console.log
);  //AABBCC

_.go(
  coll,
  L.map(m => m.get('name')),
//  _.each(console.log)
  _.reduce((obj, a) => (obj += a, obj)),
  console.log
);  //AABBCC

//**결국 collection 클래스 자체를 이터러블 할수 있게 순회하게 만들어주고, models 안의 형태는 model이어서 
//  그 안의 L.map(m => m.get('name')), 에서 m이라는 값은 보조함수를 통해 get() 메서드에 접근할 수 있다 

_.go(
  coll,
  _.each(m => m.set('name', m.get('name').toLowerCase())),
  L.map(m => m.get('name')),
  _.reduce((obj, a) => (obj += a ,obj)),
  console.log
); //aabbcc
//여기도 마찬가지로 coll 클레스 자체를 Symbol.iterator 를 통해 이터러블하게 순회할 수 있게 만들어줬기 때문에
//_each() 를 통해서 set() 메서드에 접근하여 name 키값을 가져와서 toLowerCase() 로 소문자로 바꿔준 것이다




//3. Product, Products
//앞의 Model, Collection 클래스를 상속받은 객체들도 이터러블하게 바꿔서 조합할수있게 바꿔보자
//객체지향속에서도 이터러블, 함수지향적으로 바꿀수 있는지 살펴보자!!

const addAll = _.reduce(add);
class Product extends Model {}
class Products extends Collection {
  getPrice(){
    return L.map(p => p.get('price'), this);
  }
  totalPrice(){
    return addAll(this.getPrice()); //_.reduce(함수(add), 이터러블(getPrices))  
  }                                 //로 보조함수가 완성되어 이터러블을 추가한것이다
  totalPrice1(){
    console.log([...this]);
    let total = 0;
    this._models.forEach(p => {
      total += p.get('price');
    });
    return total;
  }
  totalPrice2(){
    return _.go(
      this,
      L.map(p => p.get('price')),
      _.reduce((a,b) => a+b)
    );
  }
}

const products = new Products();
products.add(new Product({ id: 1, price: 10000 }));
console.log(products);  //Products { _models: [ Product { _attrs: [Object] } ] }
console.log(products.totalPrice()); //10000

products.add(new Product({ id: 3, price: 25000 }));
console.log(products.totalPrice()); //35000
products.add(new Product({ id: 5, price: 35000 }));
console.log(products.totalPrice()); //70000

