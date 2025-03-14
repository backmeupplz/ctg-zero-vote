// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";

contract CTGZeroVotes is
  Initializable,
  OwnableUpgradeable,
  ReentrancyGuardUpgradeable,
  IERC721Receiver
{
  // Struct to keep track of each token deposit
  struct Deposit {
    address tokenAddress;
    uint256 tokenId;
    address originalOwner;
    bool claimed;
  }

  // Array to store all deposit records
  Deposit[] private deposits;

  // Events to signal important actions
  event TokenReceived(
    address indexed tokenAddress,
    uint256 indexed tokenId,
    address indexed sender
  );
  event TokenClaimed(
    address indexed tokenAddress,
    uint256 indexed tokenId,
    address indexed originalOwner
  );
  event ContingencyTriggered(
    address indexed tokenAddress,
    uint256 indexed tokenId,
    address indexed owner
  );

  function initialize(address initialOwner) public initializer {
    __Ownable_init(initialOwner);
    __ReentrancyGuard_init();
  }

  /// @notice Called by ERC721 contracts when tokens are transferred to this contract.
  /// @dev Records the deposit and emits a TokenReceived event.
  function onERC721Received(
    address operator,
    address from,
    uint256 tokenId,
    bytes calldata data
  ) external override returns (bytes4) {
    deposits.push(
      Deposit({
        tokenAddress: msg.sender, // the ERC721 contract address
        tokenId: tokenId,
        originalOwner: from,
        claimed: false
      })
    );

    emit TokenReceived(msg.sender, tokenId, from);
    return this.onERC721Received.selector;
  }

  /// @notice Transfers back to `forAddress` all tokens that were originally deposited by it.
  /// @param forAddress The address for which to claim the tokens.
  /// @dev Only the original owner (caller must equal forAddress) can claim their tokens.
  function claimTokenBack(address forAddress) external nonReentrant {
    require(msg.sender == forAddress, "Caller must be the token owner");
    for (uint256 i = 0; i < deposits.length; i++) {
      Deposit storage dep = deposits[i];
      if (!dep.claimed && dep.originalOwner == forAddress) {
        dep.claimed = true;
        IERC721(dep.tokenAddress).safeTransferFrom(
          address(this),
          forAddress,
          dep.tokenId
        );
        emit TokenClaimed(dep.tokenAddress, dep.tokenId, forAddress);
      }
    }
  }

  /// @notice Transfers all unclaimed tokens in the contract to the owner.
  /// @dev Can only be triggered by the contract owner.
  function triggerOvertimeContingency() external onlyOwner nonReentrant {
    for (uint256 i = 0; i < deposits.length; i++) {
      Deposit storage dep = deposits[i];
      if (!dep.claimed) {
        dep.claimed = true;
        IERC721(dep.tokenAddress).safeTransferFrom(
          address(this),
          owner(),
          dep.tokenId
        );
        emit ContingencyTriggered(dep.tokenAddress, dep.tokenId, owner());
      }
    }
  }
}
