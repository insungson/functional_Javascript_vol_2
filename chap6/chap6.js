const _ = require("fxjs/Strict");
const L = require("fxjs/Lazy");
const C = require("fxjs/Concurrency");



//## 시간을 이터러블로 다루기



// 1. range와 take의 재해석
//기존의 range는 배열을 만들고 배열 전체에 대해 작업을 하고
//L.range 는 이터러블 객체를 만들고 지연적으로 원하는 작업을 할 수 있다

// _.go(
//   _.range(10),  // <--------- 0 부터 9까지의 배열
//   _.take(3),    // <--------- 앞에서부터 3개만 자르기
//   _.each(console.log)
// );
// //위는 배열을 중심으로 가로로 실행된다 (함수가 배열을 전부 돌고 다음함수로 넘어감)
// //아래는 지연적으로 이터러블을 중심으로 세로로 실행된다 
// //(함수가 이터러블 전체가 아닌 인자1개만 돌리고 다음 함수로 넘어감)
// _.go(
//   L.range(1,10),  // <--------- 1 부터 9까지의 이터러블, 최대 10번 일어날 일
//   L.map(_.delay(1000)),
//   L.filter(a => a % 2),
//   L.map(_ => new Date()),//위에서 map, filter, map의 지연적 작업을 _.take를 쓰면 한번에 실행한다(L.take와 다르다)
// //  _.take(3),  // <--------- 최대 3개의 값을 필요하고, 최대 3번의 일을 수행
//   L.take(3),    // L.take 를 사용하면 순서대로 출력된다
//   _.each(console.log)
// );
// // 2019-12-09T07:16:45.849Z
// // 2019-12-09T07:16:47.851Z
// // 2019-12-09T07:16:49.852Z





//2. takeWhile, takeUntil
//takeWhile : 즉시 평가시킨다 takeWhile(함수)  함수의 값이 true일때까지 동작한다
//ex) takeWhile(a => a, [1, 2, 3, 4, 5, 6, 7, 8, 0, 0, 0])  
//    는 1, 2, 3, 4, 5, 6, 7, 8         0을 제외한 숫자가 전부 찍힌다(0은 false이기 때문이다)
//takeUntil : takeUntil(함수)  함수의 값이 true일때 멈춘다
//ex) takeUntil(a => a, [1, 2, 3, 4, 5, 6, 7, 8, 0, 0, 0]) 
//    는 1    만 찍힌다. 1에서 바로 true가 나오기 때문이다
//    takeUntil(a => !a, [1, 2, 3, 4, 5, 6, 7, 8, 0, 0, 0])   이렇게 내부함수의 조건을 바꾸면
//    1, 2, 3, 4, 5, 6, 7, 8, 0 까지 찍힌다  계속 false 값이 찍히다가 0 에서 true값이 찍히기 때문이다

// _.go(
//   [1, 2, 3, 4, 5, 6, 7, 8, 0, 0, 0],
//   L.takeWhile(a => a),
//   _.each(console.log)
// );  //1, 2, 3, 4, 5, 6, 7, 8
// _.go(
//   [1, 2, 3, 4, 5, 6, 7, 8, 0, 0, 0],
//   L.takeUntil(a => a),
//   _.each(console.log)
// );  //1
// _.go(
//   [0, false, undefined, null, 10, 20, 30], //이런 인자들이 있다면 10에서 처름 true값이 나오기 때문에
//   L.takeUntil(a => a),              //10에서 처름 true값이 나오기 때문에
//   _.each(console.log)
// );  //0, false, undefined, null, 10        가 출력된다





//3. 할 일들을 이터러블(리스트)로 바라보기

// const track = [
//   { cars: ['철수', '영희', '철희', '영수'] },
//   { cars: ['하든', '커리', '듀란트', '탐슨'] },
//   { cars: ['폴', '어빙', '릴라드', '맥컬럼'] },
//   { cars: ['스파이더맨', '아이언맨'] },
//   { cars: [] }
// ];
// _.go(
//   L.range(Infinity),       //계속 range 적용을 시킨다
//   L.map(i => track[i]),    //이터러블 내부 인자들을 선택한다
//   L.map(({cars}) => cars), //구조분해로 인자의 배열값을 뽑아낸다 
//   L.map(_.delay(2000)),    // 시간차를 준다
//   L.takeWhile(({length:l}) => l == 4),  //길이가 4가 true일때까지 뽑아낸다 
//   //(위에서 {cars} => cars 로 구조분해 했기 때문에 {length:ㅣ} 를 위와 같이 처리한 것이다  
//   //cars.length == {length} 이다)
//       //L.takeWhile(({cars}) => cars.length == 4), 는 위의 코드와 같은 것이다
//       //L.takeWhile(({cars: {length}}) => length == 4),
//       //L.takeWhile(({cars: {length: l}}) => l == 4),
//   // L.takeUntil(({length: l}) => l < 4), //4보다 작을때까지 뽑아낸다 
//   L.flat,     //배열내부의 값들만 뽑아낸다 (자료구조(배열구조)를 펼쳐준다)
//   L.map(car => `${car} 출발!`),   //배열 내부의 값에 문자열을 더한다
//   _.each(console.log)
// );





//4. 아임포트 결제 누락 스케쥴러 만들기

//아래는 페이지 별로 결재목록을 가져오는 것이다 1페이지에 3개목록, 2페이지도 3개목록.. 
//이렇게 최대 3개를 가져올 수 있다
//(3개보다 적으면 이후부턴 페이지를 안가져온다  3페이지는 2개이므로 뒤는 더이상 목록이 없다)

const Impt = {
  payments: {
    1: [
      { imp_id: 11, order_id: 1, amount: 15000 },
      { imp_id: 12, order_id: 2, amount: 25000 },
      { imp_id: 13, order_id: 3, amount: 10000 }
    ],
    2: [
      { imp_id: 14, order_id: 4, amount: 25000 },
      { imp_id: 15, order_id: 5, amount: 45000 },
      { imp_id: 16, order_id: 6, amount: 15000 }
    ],
    3: [
      { imp_id: 17, order_id: 7, amount: 20000 },
      { imp_id: 18, order_id: 8, amount: 30000 }
    ],
    4: [],
    5: [],
    //...
  },
  getPayments: page => { //Impt.getPayments(페이지번호) 로 페이지를 요청하면 해당 결재 목록을 가져온다
    console.log(`http://..?page=${page}`); 
    return _.delay(1000 * 1, Impt.payments[page]); //1초 후에 해당 페이지서 목록을 가져온다
  },
  //Impt.cancelPayment(아이디) 로 해당 상품을 취소한다 
  cancelPayment: imp_id => Promise.resolve(`${imp_id}: 취소완료`) 
};

//가맹점에서 사용하는 DB  
const DB = {        
  getOrders: ids => _.delay(100, [    //DB.getOrders().then(console.log)   로 DB를 불러 올 수 있다
    { id: 1 },
    { id: 3 },
    { id: 7 }
  ])
};



async function job(){
  // 결제된 결제모듈측 payments 가져온다.
  // page 단위로 가져오는데,(한번에(1 page에) 최대 3개 가져올수 있음)
  // 결제 데이터가 있을 때까지 모두 가져와서 하나로 합친다.
  const payments = await _.go(
    L.range(1, Infinity),     //이터러블 공간을 만들고
    L.map(Impt.getPayments),  //내부함수를 통해 목록을 가져온다
    L.takeUntil(({length}) => length < 3),  //3개가 아닌것까지(끝까지) 가져온다 (배열의 길이로 판별)
    _.flat      //L.flat   을 사용하면 getPayments 함수에 의해 페이지 별로 딜레이를 가지게 된다
    //L.flat    // _.flat   을 사용하면 한번에 다 가져온다
  );            
  //payments는 결재 상품 목록을 다 가져온 것이다

  // 결제가 실제로 완료된 가맹점 측 주문서 id들을 뽑는다.
  const order_id = await _.go(
    payments,                  //결재 상품 목록을 가져와서
    _.map(p => p.order_id),    //주문 아이디만 뽑는다
    DB.getOrders,             //결재 상품 목록 주문아이디들을 DB와 비교하여 일치하는것만 리턴한다
    _.map(({id}) => id)       //id 만 뽑는다
  );

  // 결제모듈의 payments와 가맹점의 주문서를 비교해서
  // 결제를 취소해야할 id들을 뽑아서
  // 결제 취소 api를 실행
  await _.go(
    payments,   // 상품 목록들 중 
    L.reject(p => order_id.includes(p.order_id)), //reject로 주문된 아이디 제외
    L.map(p => p.imp_id),   //나머지 목록들 중 결재모듈 아이디 뽑는다
    L.map(Impt.cancelPayment),  //뽑힌 아이디들로 취소 API를 실행시킨다 
    _.each(console.log)     //로그찍는다
  );
}

//Job()은 연속적으로 실행되야 하기 때문에 아래같이 재귀처리와 즉시실행을 사용해보자

// 7초에 한 번만 한다.
// 그런데 만일 job 출력이 7초보다 더 걸리면, recur함수가 재귀함수처리되어 다시 실행하지만 
// 화면출력은 9초 후에 한꺼번에 된다 (7초마다 재실행은 하지만 화면 출력은
//( getPayments의 delay가 3초여서(목록3개) job의 출력이 9초)) 9초후에 되고 이때 
//7초에서 실행한 함수의( getPayments) 출력도 같이된다
(function recur(){
  Promise.all([
    _.delay(7000, undefined),
    job() //위에서 만든 job을 실행시킨다
  ]).then(recur);
})();

//위의 Promise.all([함수1(delay:10), 함수2(delay:20)]) 는 Math.max(5,10)  와 비슷한데
//Math.max가 인자 2개중 큰걸 선택하듯이 함수1, 함수2 를 비교하여 빠른걸 먼저 실행해버린다 