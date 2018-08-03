pragma solidity ^0.4.21;


import "./ConvertLib.sol";

// This is just a simple example of a coin-like contract.
// It is not standards compatible and cannot be expected to talk to other
// coin/token contracts. If you want to create a standards-compliant
// token, see: https://github.com/ConsenSys/Tokens. Cheers!

contract MetaCoin {
    mapping (address => uint) balances;
    address public lastSender;

    event Transfer(address indexed _from, address indexed _to, uint256 _value);

    event OverloadedEvent();
    event OverloadedEvent(uint a);
    event OverloadedEvent(uint a, uint b);
    event OverloadedEvent(bool a, bool b);

    event EventWithUnnamedParams(uint, bool);

    constructor() public {
        balances[tx.origin] = 10000;
    }

    function emitOverloadedEvents() public {
        emit OverloadedEvent();
        emit OverloadedEvent(2);
        emit OverloadedEvent(2, 2);
        emit OverloadedEvent(true, true);
    }

    function emitUnnamedParamsEvent() public {
        emit EventWithUnnamedParams(2, true);
    }

    /// @notice This is a notice
    /// @param receiver The receiver address
    /// @param amount The amount
    /// @return sufficient Whether the amount was sufficient
    function sendCoin(address receiver, uint amount) public returns(bool sufficient) {
        if (balances[msg.sender] < amount) return false;
        balances[msg.sender] -= amount;
        balances[receiver] += amount;
        lastSender = msg.sender;
        emit Transfer(msg.sender, receiver, amount);
        return true;
    }

    function getBalanceInEth(address addr) public view returns(uint balance){
        return ConvertLib.convert(getBalance(addr),2);
    }

    function getBalance(address addr) public view returns(uint balance) {
        return balances[addr];
    }

    // Original
    function overloaded(uint a, uint b) public pure returns(uint sum) {
        sum = a + b;
    }

    // Additional param
    function overloaded(uint a, uint b, uint c) public pure returns(uint sum) {
        sum = a + b + c;
    }

    // Both different, same names
    function overloaded(bool a, bool b) public pure returns(uint sum) {
        require(a == true && b == true);
        sum = 0;
    }

    // One different, same names
    function overloaded(uint a, bool b) public pure returns(uint sum) {
        require(b == true);
        sum = a;
    }
}
