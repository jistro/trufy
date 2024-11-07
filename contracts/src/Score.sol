// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

contract Score {
    struct Metadata {
        bytes1 isAEnterprise;
        bytes1 rank; // 01 S 02 A 03 B 04 C
        bytes1 role;
        bytes32 hashCredencial;
        uint256 score;
    }

    mapping(address => Metadata) public wallet;

    function lockData(
        address _wallet,
        bool _isAEnterprise,
        bytes1 _role, // 01 dev, 02 designer, 03 comunity, 04 marketing
        bytes32 _hashCredencial,
        uint256 _skillScore,
        uint256 _activityScore,
        uint256 _identityScore
    ) public returns (Metadata memory) {
        uint256 _score;
        if (!_isAEnterprise) {
            if (_role == 0x01) _score = _skillScore;
            else if (_role == 0x02 || _role == 0x03 || _role == 0x04)
                _score = _activityScore;
            else revert("Role not found");

            if (_identityScore == 20) _score += 15;

            wallet[_wallet] = Metadata({
                isAEnterprise: 0x00,
                rank: calculateRank(_score, _role, _hashCredencial),
                role: _role,
                hashCredencial: _hashCredencial,
                score: _score
            });
        } else {
            wallet[_wallet] = Metadata({
                isAEnterprise: 0x01,
                rank: 0x00,
                role: 0x00,
                hashCredencial: bytes32(0),
                score: 0
            });
        }

        return wallet[_wallet];
    }

    function calculateRank(
        uint256 _score,
        bytes1 _role,
        bytes32 _hashCredencial
    ) private pure returns (bytes1) {
        if (_score == 0) return 0x04;

        bool hasValidHash = _hashCredencial.length == 32;

        if (_role == 0x01) {
            if (_score >= 68 && hasValidHash) return 0x01;
            if (_score >= 51) {
                return hasValidHash ? bytes1(0x02) : bytes1(0x03);
            }
            return 0x03;
        }

        if (_score >= 96 && hasValidHash) return 0x01;
        if (_score >= 86) {
            return hasValidHash ? bytes1(0x02) : bytes1(0x03);
        }
        return 0x03;
    }

    function getMetadata(
        address _wallet
    ) public view returns (Metadata memory) {
        return wallet[_wallet];
    }

    function getClass(address _wallet) public view returns (bytes1) {
        return wallet[_wallet].rank;
    }

    function getRank(address _wallet) public view returns (bytes1) {
        return wallet[_wallet].role;
    }
}
