const _ = require("fxjs/Strict");
const L = require("fxjs/Lazy");
const C = require("fxjs/Concurrency");

// ## 안전한 합성에 대해

// 1. map으로 합성하기
const f = x => x+10;
const g = x => x-5;
const fg = x => f(g(x));

_.go(
  10,
  fg,
  console.log
);  //15
_.go(
  [], ////이렇게 map 을 이용한 모나드 합성을 하면 Nan 이라는 에러가 발생하지 않는다
  L.map(fg),
  console.log
); //{}
_.go(
  [10],
  L.map(fg),
  _.each(console.log)
);  //15



//2. find 대신 L.filter 써보기
const users = [
  { name: 'AA', age: 35 },
  { name: 'BB', age: 26 },
  { name: 'CC', age: 28 },
  { name: 'CC', age: 34 },
  { name: 'EE', age: 23 }
];
//기존의 find() 는 아래와 같이 사용할 수 있다
//만약 주석처리된것처럼 BB가 없다면.. if문으로 걸러야 undefined가 안뜬다
const user = _.find(u => u.name == 'BB', users);
if(user){
  console.log(user.age);  //26
}
//위에서 find() 사용 후 if문으로 나눈 코드를 아래같이 사용할 수 있다
//1) users 이터러블 객체에서 L.filter()로 BB 를 찾는다
//2) L.take() 로  1번의 이터러블 값중 1개를 뽑는다 (take는 배열을 리턴해주기 때문에 배열형태이다)
//3) _each()  로 콘솔로그를 찍어 2번의 이터러블 값을 밖으로 뺴준다 
_.each(console.log,
    L.take(1, 
      L.filter(u => u.name == 'BB', users)));
//{ name: 'BB', age: 26 }


//아래처럼 좀더 직관적으로 위에서 내려오는 방식으로 코드를 짜면 더 이해가 쉽다
_.go(
  users,
  L.filter(u => u.name == 'AA'),
  L.map(u => u.age),
  L.take(1),
  _.each(console.log)
); //35

//find() 같은 함수는 내부의 값을 평가를 통해(보조함수를 통해) 깨서 내보내기 때문에 if문으로 한번 걸러줘야 하지만
//L.filter() 와 L.take를 사용하면 지연적으로 평가하여 찾게되는 값을 가질때까지만 순회하기 때문에 성능에서 좋다
//ex) [1,2,3,4,5]  의 배열에서 find()를 적용시키면 배열을 다돌고 다음함수로 가는반면... 
//    지연적으로 L.filter, L.take  를 사용하면 [1,2,3,4,5] 배열의 인자 1에 대해 filter, take 처리를 하고 
//    다음인자 2로 넘어가서 같은 작업을 해주는 세로식으로 순회한다

//**앞에서 go(), pipe()  를 통해 함수를 합성하였다
//배열이라는 모나드로 사용할수 있는 값의 성질을 이용하여 해당하는 배열,이터러블 같은 값을 map, filter 을 사용하여
//안쪽의 값을 아예 꺼내는것이 아니라 배열로 유지하여 필요한 값을 빼서(take 사용) 사용할수 있도록 함수를 합성하는
//방법을 연습해보자