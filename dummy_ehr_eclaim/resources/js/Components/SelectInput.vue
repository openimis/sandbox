<template>
  <select
    :id="id"
    :value="modelValue"
    @input="event => emit('update:modelValue', event.target.value)"
    :class="['form-select', customClass]"
    :disabled="disabled"
    :required="required"
  >
    <option value="" disabled selected hidden>{{ placeholder }}</option>
    <option
      v-for="(option, index) in options"
      :key="index"
      :value="getOptionValue(option)"
    >
      {{ getOptionLabel(option) }}
    </option>
  </select>
</template>

<script setup>
const props = defineProps({
  id: String,
  customClass: {
    type: String,
    default: ''
  },
  modelValue: [String, Number],
  options: {
    type: Array,
    default: () => []
  },
  placeholder: {
    type: String,
    default: 'Select an option'
  },
  required: {
    type: Boolean,
    default: false
  },
  disabled: {
    type: Boolean,
    default: false
  },
  optionLabel: {
    type: String,
    default: 'label'
  },
  optionValue: {
    type: String,
    default: 'value'
  }
})

const emit = defineEmits(['update:modelValue'])

function getOptionLabel(option) {
  return typeof option === 'object' ? option[props.optionLabel] : option
}

function getOptionValue(option) {
  return typeof option === 'object' ? option[props.optionValue] : option
}
</script>

<style scoped>
.form-select {
  padding: 0.5rem;
  border: 1px solid #ccc;
  border-radius: 0.375rem;
  width: 100%;
}
</style>
