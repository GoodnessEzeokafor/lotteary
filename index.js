const contractSource = `
payable contract Lottery=
  record participant ={
    id:int,
    account_address:address,
    joined:int}

  record state ={
    index_counter:int,
    participants:map(int,participant)}

  entrypoint init()={
    index_counter=0,
    participants={}}

  entrypoint getParticipantLength():int=
    state.index_counter

  payable stateful entrypoint join() =
    /*
        checks the Call.value is 1 ae
        checks if the participant length is less than 5
        stores the participant
        updates the state
    */
    require(Call.value == 1*1000000000000000000,"Must Send 1ae")
    require(getParticipantLength() =< 5, "PARTICIPANT LIMIT REACHED")
    require(alreadyIn(Call.caller) == false, "Participant Already IN")
    let stored_participant = {
                id=getParticipantLength() + 1,
                account_address=Call.caller,
                joined=Chain.timestamp}
    let index = getParticipantLength() + 1
    put(state{participants[index]=stored_participant,index_counter=index})
    // if getParticipantLength() == 5
    //     winner()
  entrypoint get_participant_by_index(index:int) : participant = 
    switch(Map.lookup(index, state.participants))
      None => abort("Participant does not exist with this index")
      Some(x) => x  

  payable stateful entrypoint winner(_participant : int)=
    /*
        checks if the Participants count is == 5
        checks if the id is in the participants records
        get the winner by passing the int value to the get_participant_by_index
        the transfer the coins in the Contract to the winner's address note the winner is gotten 
        randomly from js
    */
    require(getParticipantLength() == 5, "Time To Select")
    require(Map.member(_participant,state.participants),"Not Part of the Participant")
    let winner_r = get_participant_by_index(_participant)
    Chain.spend(winner_r.account_address,Contract.balance)

  stateful function alreadyIn(_participant:address) = 
    switch(Map.lookup(5, state.participants))
      Some(x) => 
        if(x.account_address == _participant)
          true
        else
          false
    //     
    // Map.member(_participant, state.participants["participant"].account_address)
    // state[participants].participant.account_address
    //  == _participant

  stateful entrypoint delete_participant_map(index:int) =
    switch(Map.lookup(index, state.participants))
      Some(x) => put(state{participants = Map.delete(index,state.participants)})

`
const contractAddress ='ct_dHA2JWySE3BDjcm2xGbdHW3D8WWZcT5WAKG5Qu3z8o8MkMYSg'

var client = null // client defuault null
var ParticipantsArr = [] // empty arr
var participantsListLength = 0 // empty product list lenghth


// asychronus read from the blockchain
async function callStatic(func, args) {
const contract = await client.getContractInstance(contractSource, {contractAddress});
  const calledGet = await contract.call(func, args, {callStatic: true}).catch(e => console.error(e));
  const decodedGet = await calledGet.decode().catch(e => console.error(e));
  return decodedGet;
}

//Create a asynchronous write call for our smart contract
async function contractCall(func, args, value) {
  const contract = await client.getContractInstance(contractSource, {contractAddress});
  console.log("Contract:", contract)
  const calledSet = await contract.call(func, args, {amount:value}).catch(e => console.error(e));
  console.log("CalledSet", calledSet)
  return calledSet;
}


// mustche

function renderParticipantList(){
  let template = $('#template').html();
  Mustache.parse(template);
  var rendered = Mustache.render(template, {ParticipantsArr});
  $("#getParticipants").html(rendered); // id to render your temlplate
  console.log("Mustashe Template Display")
}


window.addEventListener('load', async() => {
  $("#loader").show();

  client = await Ae.Aepp();




  participantsListLength = await callStatic('getParticipantLength',[]);
  
  console.log('Files Length: ', participantsListLength);

  for(let i = 1; i < participantsListLength + 1; i++){
    const getParticipantList = await callStatic('get_participant_by_index', [i]);
    ParticipantsArr.push({
      index_counter:i,
      id:getParticipantList.id,
      account_address:getParticipantList.account_address,
      joined:new Date(getParticipantList.joined)
    })
  }
  renderParticipantList();  
  $("#loader").hide();
});




// join
$("#joinId").on("click",".joinBtn", async function(event){
  $("#loader").show();
  console.log("Join Button")

  // const dataIndex = event.target.id
  // console.log(typeof dataIndex)
  // const eventListArrPrice = eventListArr[dataIndex - 1].price
  // console.log("Price of product",eventListArrPrice)
  const join_room = await contractCall('join', [],1*1000000000000000000);
  console.log("Join Room",join_room)
  // console.log("Purchase:", purchased_event)
  
  // // const foundIndex = productListArr.findIndex(product => product.id === dataIndex)
  // // const value = $(".buyBtn")[foundIndex] ;

  // console.log("-----------------")
  // console.log("Data Index:", dataIndex)
  // console.log("--------------------------")
  
  // console.log("Just Clicked The Buy Button")
  event.preventDefault();
  $("#loader").hide();
});
