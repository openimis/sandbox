<template>
  <select>
    <option disabled selected>Select an option</option>
  </select>
</template>

<script setup>
// Dummy props to silence Vue compiler
defineProps({
  id: String,
  modelValue: [String, Number],
  options: Array,
  placeholder: String,
  required: Boolean,
  disabled: Boolean,
  optionLabel: String,
  optionValue: String,
  customClass: String
})

defineEmits(['update:modelValue'])
</script>
