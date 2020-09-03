<template>
  <div class="apos-area">
    <AposAreaMenu
      @add="insert"
      v-bind:contextOptions="addContextOpts"
      :index="0"
      :widget-options="options.widgets"
      :doc-id="docId"
    />
    <div class="apos-areas-widgets-list">
      <div
        class="apos-area-widget-wrapper"
        :class="states[i].container"
        v-for="(widget, i) in next"
        :key="widget._id"
        @mouseover="handleMouseover(i)"
        @mouseleave="handleMouseleave(i)"
        @click="handleFocus(i)"
      >
        <div 
          class="apos-area-widget-controls apos-area-widget-controls--add"
          :class="states[i].addTop"
          >
          <AposAreaMenu
            @add="insert"
            @menuOpen="addOpen(i, 'addTop')"
            @menuClose="addClose(i, 'addTop')"
            v-bind:contextOptions="addContextOpts"
            :index="i - 1"
            :widget-options="options.widgets"
            :doc-id="docId"
          />
        </div>
        <div 
          class="apos-area-widget-controls apos-area-widget-controls--move"
          :class="states[i].move"
        >
          <AposWidgetMove
            :first="i === 0"
            :last="i === next.length - 1"
            @up="up(i)"
            @down="down(i)"
          />
        </div>
        <div 
          class="apos-area-widget-controls apos-area-widget-controls--modify"
          :class="states[i].modify"
        >
          <AposWidgetModify
            @remove="remove(i)"
            @edit="edit(i)"
          />
        </div>
        <component
          v-if="editing[widget._id]"
          @save="editing[widget._id] = false"
          @close="editing[widget._id] = false"
          :is="widgetEditorComponent(widget.type)"
          :value="widget"
          @update="update"
          :options="options.widgets[widget.type]"
          :type="widget.type"
          :doc-id="docId"
        />
        <component
          v-if="(!editing[widget._id]) || (!widgetIsContextual(widget.type))"
          :is="widgetComponent(widget.type)"
          :options="options.widgets[widget.type]"
          :type="widget.type"
          :doc-id="docId"
          :id="widget._id"
          :area-field-id="fieldId"
          :value="widget"
          @edit="edit(i)"
        />
        <div 
          class="apos-area-widget-controls apos-area-widget-controls--add apos-area-widget-controls--add--bottom"
          :class="states[i].addBottom"
          >
          <AposAreaMenu
            @add="insert"
            v-bind:contextOptions="addContextOpts"
            :index="i + 1"
            :widget-options="options.widgets"
            :doc-id="docId"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script>

import Vue from 'apostrophe/vue';
import cuid from 'cuid';

export default {
  name: 'AposAreaEditor',
  props: {
    docId: {
      type: String,
      default: null
    },
    docType: {
      type: String,
      default: null
    },
    id: {
      type: String,
      required: true
    },
    fieldId: {
      type: String,
      required: true
    },
    options: {
      type: Object,
      default() {
        return {};
      }
    },
    items: {
      type: Array,
      default() {
        return [];
      }
    },
    choices: {
      type: Array,
      required: true
    }
  },
  emits: [ 'changed' ],
  data() {
    const states = [];
    this.items.forEach((w, i) => {
      states[i] = {
        move: [],
        modify: [],
        container: [],
        addTop: [],
        addBottom: []
      };
    });
    return {
      next: this.items,
      editing: {},
      show: 'apos-show',
      open: 'apos-open',
      focus: 'apos-focus',
      highlight: 'apos-highlight',
      states,
      addContextOpts: {
        autoPosition: false,
        menu: this.choices
      }
    };
  },
  computed: {
    moduleOptions() {
      return window.apos.area;
    },
    types() {
      return Object.keys(this.options.widgets);
    }
  },
  watch: {
    next() {
      if (!this.docId) {
        // For the benefit of AposInputArea which is the
        // direct parent when we are not editing on-page
        this.$emit('changed', {
          items: this.next
        });
      } else {
        // For the benefit of all other area editors on-page
        // which may have this one as a sub-area in some way, and
        // mistakenly think they know its contents have not changed
        apos.bus.$emit('area-updated', {
          _id: this.id,
          items: this.next
        });
      }
    }
  },
  mounted() {
    if (this.docId) {
      this.areaUpdatedHandler = (area) => {
        let patched = false;
        for (const item of this.next) {
          if (this.patchSubobject(item, area)) {
            patched = true;
            break;
          }
        }
        if (patched) {
          // Make sure our knowledge of the change is reflected
          // everywhere via a refresh
          this.next = this.next.slice();
        }
      };
      apos.bus.$on('area-updated', this.areaUpdatedHandler);
    }
  },
  beforeDestroy() {
    if (this.areaUpdatedHandler) {
      apos.bus.$off('area-updated', this.areaUpdatedHandler);
    }
  },
  methods: {
    addOpen(i, who) {
      console.log('iiiiiiii');
      const self = this.states[i][who];
      if (!self.includes(this.open)) {
        self.push(this.open);
      }
    },
    addClose(i, who) {
      console.log('do i go');
      this.states[i][who] = this.states[i][who].filter(e => { return e !== this.open });
      console.log(this.states[i][who]);
    },
    handleMouseover(i) {
      const self = this.states[i];
      // show move
      if (!self.move.includes(this.show)) {
        self.move.push(this.show);
      }
      // highlight widget container
      if (!self.container.includes(this.highlight)) {
        self.container.push(this.highlight);
      }
    },

    handleMouseleave(i) {
      const self = this.states[i];
      // hide move controls
      self.move = self.move.filter(i => { return i !== this.show });

      // remove hover visual
      self.container = self.container.filter(i => { return i !== this.highlight });

      // remove 
    },

    handleFocus(i) {
      const self = this.states[i];

      // remove all other focus states
      for (let k in this.states) {
        this.states[k].container = this.states[k].container.filter(i => { return i !== this.focus });
        this.states[k].modify = this.states[k].modify.filter(i => { return i !== this.show });
        this.states[k].addTop = this.states[k].addTop.filter(i => { return i !== this.show });
        this.states[k].addBottom = this.states[k].addBottom.filter(i => { return i !== this.show });
        this.states[k].move = this.states[k].move.filter(i => { return i !== this.focus });
      }

      // show Modify controls
      if (!self.modify.includes(this.show)) {
        self.modify.push(this.show);
      }

      // add focus states
      if (!self.container.includes(this.focus)) {
        self.container.push(this.focus);
      }
      if (!self.move.includes(this.focus)) {
        self.move.push(this.focus);
      }

      // show Add controls
      if (!self.addBottom.includes(this.show)) {
        self.addBottom.push(this.show);
      }
      if (!self.addTop.includes(this.show)) {
        self.addTop.push(this.show);
      }

    },
    async up(i) {
      if (this.docId) {
        await apos.http.patch(`${apos.doc.action}/${this.docId}`, {
          busy: true,
          body: {
            $move: {
              [`@${this.id}.items`]: {
                $item: this.next[i]._id,
                $before: this.next[i - 1]._id
              }
            }
          }
        });
      }
      this.next = [
        ...this.next.slice(0, i - 1),
        this.next[i],
        this.next[i - 1],
        ...this.next.slice(i + 1)
      ];
    },
    async down(i) {
      if (this.docId) {
        await apos.http.patch(`${apos.doc.action}/${this.docId}`, {
          busy: true,
          body: {
            $move: {
              [`@${this.id}.items`]: {
                $item: this.next[i]._id,
                $after: this.next[i + 1]._id
              }
            }
          }
        });
      }
      this.next = [
        ...this.next.slice(0, i),
        this.next[i + 1],
        this.next[i],
        ...this.next.slice(i + 2)
      ];
    },
    async remove(i) {
      if (this.docId) {
        await apos.http.patch(`${apos.doc.action}/${this.docId}`, {
          busy: true,
          body: {
            $pullAllById: {
              [`@${this.id}.items`]: [ this.next[i]._id ]
            }
          }
        });
      }
      this.next = [
        ...this.next.slice(0, i),
        ...this.next.slice(i + 1)
      ];
    },
    edit(i) {
      Vue.set(this.editing, this.next[i]._id, !this.editing[this.next[i]._id]);
    },
    async update(widget) {
      if (this.docId) {
        await apos.http.patch(`${apos.doc.action}/${this.docId}`, {
          busy: 'contextual',
          body: {
            [`@${widget._id}`]: widget
          }
        });
      }
      const index = this.next.findIndex(w => w._id === widget._id);
      this.next = [
        ...this.next.slice(0, index),
        widget,
        ...this.next.slice(index + 1)
      ];
      if (!this.widgetIsContextual(widget.type)) {
        this.editing[widget._id] = false;
      }
    },
    async insert(e) {
      const widget = e.widget;
      if (!widget._id) {
        widget._id = cuid();
      }
      const push = {
        $each: [ widget ]
      };
      if (e.index < this.next.length) {
        push.$before = this.next[e.index]._id;
      }
      if (this.docId) {
        await apos.http.patch(`${apos.doc.action}/${this.docId}`, {
          busy: true,
          body: {
            $push: {
              [`@${this.id}.items`]: push
            }
          }
        });
      }
      this.next = [
        ...this.next.slice(0, e.index),
        widget,
        ...this.next.slice(e.index)
      ];
      if (this.widgetIsContextual(widget.type)) {
        this.edit(e.index);
      }
    },
    widgetComponent(type) {
      return this.moduleOptions.components.widgets[type];
    },
    widgetEditorComponent(type) {
      return this.moduleOptions.components.widgetEditors[type];
    },
    widgetIsContextual(type) {
      return this.moduleOptions.widgetIsContextual[type];
    },
    // Recursively seek `subObject` within `object`, based on whether
    // its _id matches that of a sub-object of `object`. If found,
    // replace that sub-object with `subObject` and return `true`.
    patchSubobject(object, subObject) {
      let key;
      let val;
      let result;
      for (key in object) {
        val = object[key];
        if (val && typeof val === 'object') {
          if (val._id === subObject._id) {
            object[key] = subObject;
            return true;
          }
          result = this.patchSubobject(val, subObject);
          if (result) {
            return result;
          }
        }
      }
    }
  }
};

</script>

<style lang="scss" scoped>
$offset-0: 10px;
.apos-area {
  /* margin: 5px;
  padding: 5px;
  border: 2px solid var(--a-brand-green); */
}

.apos-areas-widgets-list {
  min-height: 64px;
}

.apos-area-widget-wrapper {
  position: relative;
  min-height: 50px;
  outline-offset: $offset-0;
}

.apos-highlight {
  outline: 1px dotted var(--a-primary);
}

.apos-area-widget-wrapper.apos-focus {
  z-index: $z-index-default;
  outline: 1px solid var(--a-primary);
}

.apos-area-widget-controls {
  position: absolute;
  opacity: 0;
  pointer-events: none;
  transition: all 0.3s ease;
}

.apos-area-widget-controls--modify {
  top: calc(-1 * #{$offset-0});
  transform: translateY(-85%);
}
.apos-area-widget-controls--move {
  top: 50%;
  left: calc(-1 * #{$offset-0 + 5});
  transform: translate3d(-100%, -50%, 0);
}

.apos-area-widget-controls--move.apos-focus {
  opacity: 1;
  pointer-events: auto;
}

.apos-area-widget-controls.apos-show {
  opacity: 1;
  pointer-events: auto;
}

.apos-area-widget-controls--add {
  top: 0;
  left: 50%;
  transform: translate3d(-50%, calc(-50% - #{$offset-0}), 0);
}

.apos-area-widget-controls--add.apos-open {
  z-index: $z-index-default;
}

.apos-area-widget-controls--add--bottom {
  top: auto;
  bottom: 0;
  transform: translate3d(-50%, calc(50% + #{$offset-0}), 0);
}

.apos-area /deep/ .apos-context-menu__popup.is-visible {
  top: calc(100% + 20px);
  left: 50%;
  transform: translate(-50%, 0);
}
</style>
