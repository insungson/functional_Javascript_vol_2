const FxJS = require("fxjs");
const _ = require("fxjs/Strict");
const L = require("fxjs/Lazy");
const C = require("fxjs/Concurrency");

// # 함수형 프로그래밍과 JavaScript ES6+ 응용편

// ## 이터러블 프로그래밍 혹은 리스트 프로세싱 (Lisp)

// 1. 홀수 n개 더하기   (명령형 코드)
function f1(limit, list){
  let acc = 0;
  for(const a of list){
    if(a % 2){
      const b = a * a;
      acc += b;
      if(--limit == 0) break;
    }
  }
  console.log(acc);
}
f1(3,[1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
//35

//아래의 과정으로 명령형 코드 -> 함수형 코드  라고 생각하자
// 2. if를 filter로 (명령형 코드 -> 함수형 코드)
// 3. 값 변화 후 변수 할당을 map으로  (명령형 코드 -> 함수형 코드)
// 4. break를 take로  (명령형 코드 -> 함수형 코드)
// 5. 축약 및 합산을 reduce로 (명령형 코드 -> 함수형 코드)

console.log(...L.filter(a => a%2, [1,2,3,4]));  //1 3
//...은 배열의 값만 뽑아내기 때문에 즉시 실행이 된다

//(함수형 코드)

const add = (a, b) => a + b;

function f2(limit, list) {    //이 코드는 함수형 코드이다
  _.go(
    list,
    L.filter(a => a % 2), //filter() 로 걸러주기 때문에 효율이 좋아진다
    L.map(a => a * a),
    L.take(limit),
    _.reduce(add),
    console.log
  );
}
f2(3, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]); //35


//6. while을 range로 (명령형코드 -> 함수형코드)
//7. 효과를 each로 구분

//명령형 코드
function f3(end){
  let i = 1 ;
  let j = '';
  while(i < end){
    j += i;
    i += 2;
  }
  console.log(j);
}
f3(10); //13579

//함수형코드
function f4(end){
  _.go(
    L.range(1, end, 2),
    _.reduce((a,b) => `${a}${b}`),
    console.log
  );
}
f4(10); //13579


//8. 추억의 별 그리기, 구구단
let s = '';
for(let i=0; i<6; i++){
  for(let k=0; k<i; k++){
    s += '*';
  }
  s += '\n';
}
console.log(s);

const join = sep => _.reduce((a,b) => `${a}${sep}${b}`);
_.go(
  L.range(1,6),           //1,..6 에대한 이터러블 만듬
  L.map(L.range),         //map으로 이터러블의 각인자랑 연결시킴
  L.map(L.map(_ => '*')), //map을 두번 적용시켜야 각 이터러블의 인자수 만큼 적용된다 (*을 안바꾸면 숫자가 찍힘)
  L.map(join('')),    //이터러블 객체를 콘솔에 찍게 바꾼다 ([object Generator] 이줄을 주석처리하면 이게 5개 생김)
  join('\n'),         //이터러블 객체들을([object Generator] 5개) 합쳐준다 그러면서 구분으로 줄을 변경한다
  console.log
);


_.go(
  L.range(2,10),
  L.map(a => _.go(
    L.range(1,10),
    L.map(b => `${a}X${b}=${a*b}`),
    join('\n')
  )),
  join('\n\n'),
  console.log
);
