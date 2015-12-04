<div class="CDB-Widget-header">
  <div class="CDB-Widget-title CDB-Widget-contentSpaced">
    <div class="CDB-Widget-contentSpaced">
      <h3 class="CDB-Widget-textBig"><%- title %></h3>
    </div>
    <button class="CDB-Shape-threePoints js-collapse" data-tooltip="<%- isCollapsed ? 'Show' : 'Hide' %>">
      <span class="CDB-Shape-threePointsItem"></span>
    </button>
  </div>
</div>
<div class="CDB-Widget-content">
  <div class="CDB-Widget-body">
    <div id="js-miniMap" style="display: block; width: 100%; height: <%- mapHeight %>px;" ></div>
  </div>
</div>
