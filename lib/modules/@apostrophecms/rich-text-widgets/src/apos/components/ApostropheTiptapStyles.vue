<template>
  <select :value="active()" @change="useStyle">
    <option
      v-for="(style, i) in options.styles" :key="style.label"
      :value="i"
    >
      {{ style.label }}
    </option>
  </select>
</template>

<script>

export default {
  name: 'ApostropheTiptapStyles',
  props: {
    name: String,
    editor: Object,
    tool: Object,
    options: Object
  },
  methods: {
    active() {
      const styles = this.options.styles || [];
      for (let i = 0; (i < styles.length); i++) {
        const style = styles[i];
        const attrs = {
          tag: style.tag,
          class: style.class || null
        };
        if (this.editor.isActive.styles(attrs)) {
          return i;
        }
      }
      return 0;
    },
    useStyle($event) {
      const style = this.options.styles[$event.target.value];

      this.editor.commands.styles(style);
    }
  }
};
</script>
