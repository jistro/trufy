// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

contract Score {

    struct Metadata {
        bytes1 isAEnterprise;
        bytes1 class; // 01 S 02 A 03 B 
        string role;
        bytes32 hashCredencial;
        uint256 talentScore;
        
    }
    
    mapping (address => Metadata) public wallet;

    function lockData(
        address _wallet,
        bytes1 _isAEnterprise,
        string memory _role,
        bytes32 _hashCredencial,
        uint256 _talentScore
    ) public {
        bytes1 _class;
        //si es talent mas o igual de 90 y el tamaño de la credencial es el maximo das S 
        if (_talentScore >= 90 && _hashCredencial.length == 32) {
            _class = 0x01;
        } else if (_talentScore >= 80 && _talentScore < 90) {
            _class = 0x02;
        } else if (_talentScore <= 50) {
            _class = 0x03;
        } else {
            revert();
        }


        wallet[_wallet] = Metadata({
            isAEnterprise: _isAEnterprise,
            class: _class,
            role: _role,
            hashCredencial: _hashCredencial,
            talentScore: _talentScore
        });
    }

    function getMetadata(address _wallet) public view returns (Metadata memory) {
        return wallet[_wallet];
    }

    function getClass(address _wallet) public view returns (bytes1) {
        return wallet[_wallet].class;
    }

    function getRole(address _wallet) public view returns (string memory) {
        return wallet[_wallet].role;
    }

}
