Glamora: Decentralized Fashion Social Platform on Stacks
## Description
Glamora is a decentralized fashion social platform where creators share fashion content across 5 categories (Fashion Shows, Lookbooks, Tutorials, Behind-the-Scenes, Reviews) and receive direct STX cryptocurrency tips from fans. Public users can follow creators and support them with tips. Platform takes only 5% fee, creators keep 95%.

## Features
- **Creator Profiles**: Fashion creators showcase expertise and build followers
- **Public User Profiles**: Fashion enthusiasts discover trends and support creators  
- **Content Publishing**: Share fashion content across 5 specialized categories
- **STX Tipping System**: Direct cryptocurrency support (95% to creators, 5% platform fee)
- **Social Following**: Build connections within the fashion community
- **Secure Storage**: Modular data architecture with authorization controls

## Smart Contracts
- **main.clar**: Core platform logic for profiles, content publishing, tipping, and social features
- **storage.clar**: Secure data storage for all platform information with access controls

## Architecture
- Modular design with separated logic and storage contracts
- Authorization system ensuring only main contract can write to storage
- Platform statistics tracking (users, content, tips, fees)
- Minimum tip requirement: 1 STX (100,000 microstacks)

## Testing & Development
1. Install Clarinet from https://github.com/hirosystems/clarinet/releases
2. Create a new project: `clarinet new glamora`
3. Copy `main.clar` and `storage.clar` from this repository to the `glamora/contracts` folder
4. Validate contracts: `clarinet check`
5. Run tests: `clarinet test`  

## Content Categories
1. Fashion Shows - Runway and model showcases
2. Lookbooks - Style photo collections  
3. Tutorials - Educational fashion content
4. Behind-the-Scenes - Creative process insights
5. Reviews - Fashion product evaluations

## Future Roadmap
- NFT integration for unique fashion collectibles and creator rewards
- IPFS integration for decentralized content storage
- Enhanced creator monetization features
- Mobile application development
- Community governance implementation

**Author**: Timothy Terese Chimbiv  
**Version**: 3.0
