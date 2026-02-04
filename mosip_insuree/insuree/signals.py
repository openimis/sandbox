from core.signals import Signal


_insuree_policy_before_query_signal_params = ["user", "additional_filter"]
signal_before_insuree_policy_query = Signal(_insuree_policy_before_query_signal_params)
signal_before_family_query = Signal(_insuree_policy_before_query_signal_params)
signal_before_insuree_search_query = Signal(_insuree_policy_before_query_signal_params)


def _read_signal_results(result_signal):
    # signal result is a representation of list of tuple (function, result)
    return [result[1] for result in result_signal if result[1] is not None]
