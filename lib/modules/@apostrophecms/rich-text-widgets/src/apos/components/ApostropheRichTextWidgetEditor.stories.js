import ApostropheRichTextWidgetEditor from './ApostropheRichTextWidgetEditor.vue';

const options = {
  toolbar: [
    'styles', '|',
    'bold', 'italic', 'strike', 'link', '|',
    'bullet_list', 'ordered_list', '|',
    'blockquote', 'code_block', '|',
    'horizontal_rule', '|',
    'undo', 'redo'
  ]
};

const value = {
  '_id': '012345abcdef',
  'type': '@apostrophecms/rich-text',
  'content': ''
};

export default {
  title: 'Rich Text Editor'
};

export const richTextEditor = () => ({
  components: {
    ApostropheRichTextWidgetEditor
  },
  data() {
    return {
      options,
      value
    };
  },
  template: `
    <ApostropheRichTextWidgetEditor
      @save="console.log('save')"
      @close="console.log('close')"
      :options="options"
      :value="value"
      type="@apostrophecms/rich-text"
      id="thisisthewidgetid"
      docId="thisisthedocid"
    />
  `
});

// <ApostropheRichTextWidgetEditor
//   v-if="editing[wrapped.widget._id]"
//   @save="editing[wrapped.widget._id] = false"
//   @close="editing[wrapped.widget._id] = false"
//   v-model="wrapped.widget"
//   :options="options.widgets[wrapped.widget.type]"
//   :type="wrapped.widget.type"
//   :docId="docId"
//   :id="wrapped.widget._id"
// />
