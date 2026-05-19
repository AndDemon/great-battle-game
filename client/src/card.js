export function createCardHTML(card, isPlayable = false, isSelected = false, location = 'board') {
    const className = `card ${isPlayable ? 'playable' : 'disabled'}`;
    const wrapperClass = isSelected ? 'selected-attacker' : '';
    
    const dataAttribute = location === 'hand' 
        ? `data-hand-id="${card.uniqueHandId}"` 
        : `data-board-id="${card.uniqueBoardId}"`;

    const stackBadge = card.stackCount && card.stackCount > 1 
        ? `<div style="position: absolute; top: -15px; right: -15px; background: #e74c3c; color: white; border-radius: 50%; width: 25px; height: 25px; display: flex; align-items: center; justify-content: center; font-weight: bold; border: 2px solid #222; box-shadow: 0 2px 5px rgba(0,0,0,0.5); z-index: 10;">x${card.stackCount}</div>` 
        : '';

    const rarity = card.rarity ? card.rarity.toLowerCase() : 'common';

    const cardHtml = `
        <div class="${className}" ${dataAttribute} style="position: relative;">
            ${stackBadge} 
            
            <div class="card-rarity rarity-${rarity}">${rarity}</div>
            
            <div class="card-header">
                <span class="card-cost">${card.cost} Energy</span>
                <h4 class="card-title">${card.name}</h4>
            </div>
            ${card.image_url ? `<img class="card-image" src="${card.image_url}" alt="${card.name}" />` : ''}
            <div class="card-stats">
                <span class="stat-attack">ATK: ${card.attack}</span>
                <span class="stat-defense">DEF: ${card.defense}</span>
            </div>
        </div>
    `;

    return wrapperClass ? `<div class="${wrapperClass}">${cardHtml}</div>` : cardHtml;
}